import json
import base64
import io
import os
from pathlib import Path
from urllib.parse import urlparse
import unittest
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timedelta
from unittest.mock import patch
import psycopg

from fastapi import HTTPException
from fastapi.testclient import TestClient
from graphql import build_schema, introspection_from_schema, validate_schema

import agent
import gateway
import newsletter
import store
from newsletter_images import render_cards
from PIL import Image
from main import app

SCHEMA = build_schema("""
type empresas { id:ID!, email:String, nome:String }
input IdFilter { _eq:ID }
input StringFilter { _eq:String, _is_null:Boolean }
input empresas_bool_exp { id:IdFilter, email:StringFilter, nome:StringFilter }
input empresas_set_input { email:String, nome:String }
input empresas_insert_input { email:String, nome:String }
type UpdateResult { affected_rows:Int! }
type query_root { empresas(limit:Int,where:empresas_bool_exp):[empresas!]! empresas_by_pk(id:ID!):empresas }
type mutation_root { insert_empresas_one(object:empresas_insert_input!):empresas update_empresas(where:empresas_bool_exp!,_set:empresas_set_input):UpdateResult }
schema { query:query_root mutation:mutation_root }
""")
USER = {"id": "user-1", "admin": True, "authorization": "Bearer test"}


class ServiceTests(unittest.TestCase):
    def setUp(self):
        test_url = os.environ.get("TEST_DATABASE_URL", "postgresql://test_intelligence@127.0.0.1:55439/intelligence_test")
        parsed = urlparse(test_url)
        if parsed.hostname not in ("localhost", "127.0.0.1") or parsed.path != "/intelligence_test":
            raise RuntimeError("Testes exigem PostgreSQL LOCAL no banco intelligence_test, nunca produção.")
        self.environment = patch.dict(os.environ, {"DATABASE_URL": test_url, "OPENAI_API_KEY": "test", "OPENAI_MODEL": "test", "NEWSLETTER_MODEL": "test", "EVOLUTION_API_URL": "https://test.local", "EVOLUTION_INSTANCE": "test", "EVOLUTION_API_KEY": "test"})
        self.environment.start()
        with psycopg.connect(test_url, autocommit=True) as connection:
            connection.execute((Path(__file__).parents[2]/"docs/sql/2026-10-22-intelligence-postgres.sql").read_text(encoding="utf-8"))
            connection.execute("TRUNCATE sindroupas_intelligence.requests, sindroupas_intelligence.proposals, sindroupas_intelligence.newsletters, sindroupas_intelligence.deliveries, sindroupas_intelligence.image_assets, sindroupas_intelligence.generation_jobs")
            connection.execute("UPDATE sindroupas_intelligence.settings SET value=? WHERE id=1".replace("?", "%s"), (json.dumps({"enabled": False, "time": "09:00", "number": "", "images_enabled": False}),))
        store.init()

    def tearDown(self):
        app.dependency_overrides.clear()
        self.environment.stop()

    def add_request(self, id_="request-00000000001", user=USER):
        with store.db() as c:
            c.execute("INSERT INTO requests VALUES(?,?,?,?,?,?,?)", (id_, user["id"], store.now().date().isoformat(), "test", "done", None, store.now().isoformat()))
        return id_

    def proposal(self, action="update"):
        request_id = self.add_request()
        with patch.object(agent, "hasura", return_value={"record": {"id": "company-1", "email": "old@example.com"}}):
            return agent.prepare_proposal(USER, SCHEMA, request_id, "empresas", action, "company-1" if action == "update" else "", {"email": "new@example.com"}, "Corrigir e-mail")

    def test_quota_eight_and_replay(self):
        answer = {"status": "completed", "output": [{"type": "message", "content": [{"type": "output_text", "text": "Olá"}]}]}
        with patch.object(agent, "load_schema", return_value=SCHEMA), patch.object(agent, "response", return_value=answer) as response:
            for i in range(8):
                agent.ask(USER, f"request-0000000000{i}", "Olá")
            agent.ask(USER, "request-00000000000", "Olá")
            self.assertEqual(response.call_count, 8)
            with self.assertRaises(HTTPException) as error:
                agent.ask(USER, "request-00000000008", "Outro pedido")
            self.assertEqual(error.exception.status_code, 429)
            self.assertEqual(store.quota(USER["id"])["used"], 8)

    def test_concurrent_quota(self):
        answer = {"status": "completed", "output": []}
        def run(i):
            try:
                agent.ask(USER, f"concurrent-request-{i}", "test")
                return True
            except HTTPException as error:
                self.assertEqual(error.status_code, 429)
                return False
        with patch.object(agent, "load_schema", return_value=SCHEMA), patch.object(agent, "response", return_value=answer):
            with ThreadPoolExecutor(max_workers=10) as executor:
                self.assertEqual(sum(executor.map(run, range(10))), 8)

    def test_clear_history_preserves_quota_and_audit_and_rejects_pending(self):
        proposal = self.proposal()
        self.add_request("other-user-request", {**USER, "id": "other-user"})
        app.dependency_overrides[gateway.session] = lambda: USER
        client = TestClient(app)
        self.assertEqual(len(client.get("/agent/history").json()["items"]), 1)
        self.assertEqual(client.post("/agent/history/clear").status_code, 200)
        history = client.get("/agent/history").json()
        self.assertEqual(history["items"], [])
        self.assertEqual(history["quota"], store.quota(USER["id"]))
        self.assertEqual(history["quota"]["remaining"], 7)
        with store.db() as c:
            self.assertEqual(c.execute("SELECT count(*) FROM requests").fetchone()[0], 2)
            self.assertEqual(c.execute("SELECT status FROM proposals WHERE id=?", (proposal["id"],)).fetchone()[0], "rejected")
            self.assertIsNone(c.execute("SELECT result FROM requests WHERE user_id='other-user'").fetchone()[0])
        with patch.object(agent, "hasura") as hasura:
            self.assertEqual(agent.decide(USER, proposal["id"], True)["status"], "rejected")
            hasura.assert_not_called()
        with patch.object(agent, "load_schema", return_value=SCHEMA), patch.object(agent, "response", return_value={"output": []}) as response:
            agent.ask(USER, "request-after-clear", "Nova conversa")
            self.assertEqual(response.call_args.args[0]["input"], [{"role": "user", "content": "Nova conversa"}])

    def test_clear_history_blocks_running_and_requires_login(self):
        client = TestClient(app)
        self.assertEqual(client.post("/agent/history/clear").status_code, 401)
        self.add_request()
        with store.db() as c:
            c.execute("UPDATE requests SET status='running'")
        app.dependency_overrides[gateway.session] = lambda: USER
        self.assertEqual(client.post("/agent/history/clear").status_code, 409)

    def test_proposal_is_not_a_write_and_has_own_id(self):
        proposal = self.proposal()
        self.assertNotEqual(proposal["id"], proposal["record_id"])
        self.assertEqual(proposal["before"]["email"], "old@example.com")
        with store.db() as c:
            self.assertEqual(c.execute("SELECT status FROM proposals").fetchone()[0], "pending")

    def test_reject_does_not_call_hasura(self):
        proposal = self.proposal()
        with patch.object(agent, "hasura") as h:
            self.assertEqual(agent.decide(USER, proposal["id"], False)["status"], "rejected")
            h.assert_not_called()

    def test_confirm_is_single_use_and_conditional(self):
        proposal = self.proposal()
        calls = []
        def hasura(_user, query, variables):
            calls.append((query, variables))
            if query.startswith("query"):
                return {"record": {"id": "company-1", "email": "old@example.com"}}
            self.assertEqual(variables["where"], {"id": {"_eq": "company-1"}, "email": {"_eq": "old@example.com"}})
            return {"result": {"affected_rows": 1}}
        with patch.object(agent, "load_schema", return_value=SCHEMA), patch.object(agent, "hasura", side_effect=hasura):
            self.assertEqual(agent.decide(USER, proposal["id"], True)["status"], "executed")
            self.assertEqual(agent.decide(USER, proposal["id"], True)["status"], "executed")
        self.assertEqual(len(calls), 2)

    def test_cross_user_confirmation_denied(self):
        proposal = self.proposal()
        with self.assertRaises(HTTPException) as error:
            agent.decide({**USER, "id": "another-user"}, proposal["id"], True)
        self.assertEqual(error.exception.status_code, 404)

    def test_changed_record_denies_write(self):
        proposal = self.proposal()
        with patch.object(agent, "load_schema", return_value=SCHEMA), patch.object(agent, "hasura", return_value={"record": {"id": "company-1", "email": "changed@example.com"}}) as h:
            self.assertEqual(agent.decide(USER, proposal["id"], True)["status"], "failed")
            self.assertEqual(h.call_count, 1)

    def test_expired_proposal_denied(self):
        proposal = self.proposal()
        with store.db() as c:
            c.execute("UPDATE proposals SET created_at=?", ((store.now()-timedelta(hours=1)).isoformat(),))
        with self.assertRaises(HTTPException):
            agent.decide(USER, proposal["id"], True)

    def test_mutation_cannot_enter_read_tool(self):
        with patch.object(agent, "hasura") as h:
            with self.assertRaises(ValueError):
                agent.query_data(USER, SCHEMA, 'mutation { insert_empresas_one(object:{nome:"x"}) {id} }', {})
            h.assert_not_called()

    def test_read_limit_enforced(self):
        with patch.object(agent, "hasura", return_value={"empresas": []}) as h:
            agent.query_data(USER, SCHEMA, "query { empresas { id } }", {})
            self.assertIn("limit: 50", h.call_args.args[1])
            with self.assertRaises(ValueError):
                agent.query_data(USER, SCHEMA, "query { empresas(limit:99999) { id } }", {})

    def test_hasura_uses_only_session_header(self):
        with patch.dict(os.environ, {"HASURA_URL": "https://example.com/graphql"}), patch.object(gateway.requests, "post") as post:
            post.return_value.ok = True
            post.return_value.json.return_value = {"data": {"ok": True}}
            gateway.hasura(USER, "query { __typename }")
            self.assertEqual(post.call_args.kwargs["headers"], {"Authorization": "Bearer test"})

    def test_delivery_without_destination_is_not_sent(self):
        with patch.object(newsletter, "evolution") as e:
            with self.assertRaises(HTTPException):
                newsletter.send("any-id", {"number": ""})
            e.assert_not_called()

    def test_group_delivery_is_once_and_same_evolution_paths(self):
        with store.db() as c:
            c.execute("INSERT INTO newsletters(id,week,status,period_start,period_end,content,created_at) VALUES('n','2026-43','ready','2026-10-15','2026-10-22','texto',?)", (store.now().isoformat(),))
            c.execute("UPDATE newsletters SET media=? WHERE id='n'", (json.dumps([{"url": "https://example.com/original.jpg", "caption": "Legenda original"}]),))
        config = {"number": "120363123456789@g.us", "destination_type": "group", "photo_urls": ["https://example.com/photo.jpg"]}
        with patch.object(newsletter, "evolution", return_value={"key": {"id": "sent"}}) as e:
            self.assertEqual(newsletter.send("n", config)["status"], "sent")
            self.assertEqual(newsletter.send("n", config)["status"], "sent")
            self.assertEqual(e.call_count, 2)  # Texto e foto; a segunda confirmação não reenvia.
            self.assertEqual(e.call_args_list[0].args[1]["number"], config["number"])
            self.assertEqual(e.call_args_list[1].args[1]["media"], "https://example.com/original.jpg")

    def test_news_date_source_and_dedup_checks(self):
        start, end = date(2026, 10, 15), date(2026, 10, 22)
        articles = [{"title": f"Notícia {i}", "summary": "Fato e impacto", "emoji": "🏭", "published_at": "2026-10-21", "url": f"https://source{i%3}.com/news/{i}", "story_key": f"story-{i}"} for i in range(6)]
        response = {"output": [{"type": "web_search_call", "action": {"sources": [{"url": article["url"]} for article in articles]}}]}
        data = {"articles": articles, "reading": "Síntese"}
        self.assertEqual(len(newsletter.verify(data, response, start, end, [])), 6)
        with self.assertRaises(ValueError):
            newsletter.verify(data, response, start, end, [{"articles": articles}])
        with self.assertRaises(ValueError):
            newsletter.verify(data, response, date(2026, 10, 22), end, [])
        with self.assertRaises(ValueError):
            newsletter.verify(data, {"output": []}, start, end, [])

    def test_generation_is_once_per_week(self):
        with patch.object(newsletter, "response", side_effect=RuntimeError("modelo indisponível")) as r:
            newsletter.generate()
            newsletter.generate()
            self.assertEqual(r.call_count, 1)
            self.assertEqual(len(newsletter.history()), 1)
            self.assertEqual(newsletter.history()[0]["status"], "failed")

    def test_wednesday_schedule_and_disabled_state(self):
        config = {"enabled": True, "time": "09:00"}
        self.assertFalse(newsletter.schedule_due(config, datetime(2026, 10, 20, 10, tzinfo=store.TZ)))
        self.assertFalse(newsletter.schedule_due(config, datetime(2026, 10, 21, 8, 59, tzinfo=store.TZ)))
        self.assertTrue(newsletter.schedule_due(config, datetime(2026, 10, 21, 9, tzinfo=store.TZ)))
        self.assertFalse(newsletter.schedule_due({**config, "enabled": False}, datetime(2026, 10, 21, 9, tzinfo=store.TZ)))

    def test_quota_renews_on_fortaleza_day(self):
        self.add_request()
        with patch.object(store, "now", return_value=store.now()+timedelta(days=1)):
            self.assertEqual(store.quota(USER["id"])["remaining"], 8)

    def test_creation_requires_confirmation_and_is_not_repeated(self):
        proposal = self.proposal("create")
        with patch.object(agent, "load_schema", return_value=SCHEMA), patch.object(agent, "hasura", return_value={"result": {"id": "new-id"}}) as h:
            self.assertEqual(agent.decide(USER, proposal["id"], True)["status"], "executed")
            self.assertEqual(agent.decide(USER, proposal["id"], True)["status"], "executed")
            self.assertEqual(h.call_count, 1)

    def test_unknown_write_result_is_not_retried(self):
        proposal = self.proposal("create")
        with patch.object(agent, "load_schema", return_value=SCHEMA), patch.object(agent, "hasura", side_effect=HTTPException(502, "timeout")) as h:
            self.assertEqual(agent.decide(USER, proposal["id"], True)["status"], "uncertain")
            self.assertEqual(agent.decide(USER, proposal["id"], True)["status"], "uncertain")
            self.assertEqual(h.call_count, 1)

    def test_routes_require_session_and_newsletter_requires_admin(self):
        with TestClient(app) as client:
            self.assertEqual(client.get("/agent/history").status_code, 401)
            app.dependency_overrides[gateway.session] = lambda: {**USER, "admin": False}
            self.assertEqual(client.get("/newsletter").status_code, 403)
            self.assertEqual(client.get("/agent/history").status_code, 200)

    def test_default_models(self):
        with patch.dict(os.environ, {"OPENAI_MODEL": "", "NEWSLETTER_MODEL": ""}):
            self.assertEqual(gateway.env("OPENAI_MODEL"), "gpt-6.1-sol")
            self.assertEqual(gateway.env("NEWSLETTER_MODEL"), "gpt-6.1-sol")

    def test_queue_deduplicates_and_records_failure(self):
        first = newsletter.enqueue(USER["id"])
        self.assertEqual(newsletter.enqueue(USER["id"])["job_id"], first["job_id"])
        with patch.object(newsletter, "response", side_effect=RuntimeError("modelo indisponível")) as response:
            newsletter.process_job()
            newsletter.process_job()
            self.assertEqual(response.call_count, 1)
        with store.db() as c:
            row = c.execute("SELECT * FROM generation_jobs WHERE id=?", (first["job_id"],)).fetchone()
            self.assertEqual(row["status"], "failed")
            self.assertIsNotNone(row["newsletter_id"])

    def test_queue_waits_for_key(self):
        job = newsletter.enqueue(USER["id"])
        with patch.dict(os.environ, {"OPENAI_API_KEY": ""}), patch.object(newsletter, "response") as response:
            newsletter.process_job()
            response.assert_not_called()
        with store.db() as c:
            self.assertEqual(c.execute("SELECT status FROM generation_jobs WHERE id=?", (job["job_id"],)).fetchone()[0], "blocked")

    def test_png_cards_keep_source_and_summary(self):
        articles = [{"title": "Indústria de confecção no Ceará", "summary": "Indicadores e perspectivas para o setor.", "url": "https://example.com/materia", "published_at": "2026-10-21"}]
        cards = render_cards(articles, "Síntese da semana.", date(2026, 10, 15), date(2026, 10, 22), {"cta_label": "Fale com o sindicato", "cta_url": "https://example.com/contato"})
        self.assertEqual(len(cards), 3)
        self.assertIn(articles[0]["url"], cards[1]["caption"])
        for card in cards:
            with Image.open(io.BytesIO(card["content"])) as image:
                self.assertEqual(image.format, "PNG")
                self.assertEqual(image.width, 1080)
                self.assertEqual(image.height, 1350)

    def test_real_auth_envelope_loads_newsletter_without_session_override(self):
        with patch.dict(os.environ, {"AUTH_URL": "https://auth.test"}), patch.object(gateway.requests, "get") as get, TestClient(app) as client:
            get.return_value.status_code = 200
            get.return_value.json.return_value = {"user": {"id": "admin-qa", "role": "admin", "status": "active"}}
            result = client.get("/newsletter", headers={"Authorization": "Bearer qa-token"})
            self.assertEqual(result.status_code, 200)
            self.assertIn("settings", result.json())
            self.assertIn("editions", result.json())
            get.return_value.json.return_value = {"user": {"id": "user-qa", "is_active": True, "profile_code": "financeiro"}}
            self.assertEqual(client.get("/newsletter", headers={"Authorization": "Bearer qa-token"}).status_code, 403)
            self.assertEqual(client.get("/agent/history", headers={"Authorization": "Bearer qa-token"}).status_code, 200)
            get.return_value.json.return_value = {"user": {"id": "admin-qa", "role": "admin", "status": "inactive"}}
            self.assertEqual(client.get("/newsletter", headers={"Authorization": "Bearer qa-token"}).status_code, 401)

    def test_image_route_requires_admin(self):
        with patch("main.newsletter.process_job"), TestClient(app) as client:
            self.assertEqual(client.get("/newsletter/images/asset").status_code, 401)
            app.dependency_overrides[gateway.session] = lambda: {**USER, "admin": False}
            self.assertEqual(client.get("/newsletter/images/asset").status_code, 403)

    def test_images_for_existing_text_are_idempotent_and_never_send(self):
        articles = [{"title": "Notícia já salva", "summary": "Resumo preservado", "url": "https://example.com/noticia", "published_at": "2026-10-21"}]
        with store.db() as c:
            c.execute("INSERT INTO newsletters(id,week,status,period_start,period_end,content,articles,reading,created_at) VALUES(?,?,?,?,?,?,?,?,?)", ("image-test", "2026-43", "ready", "2026-10-15", "2026-10-22", "Texto original", json.dumps(articles), "Síntese original", store.now().isoformat()))
        with patch.object(newsletter, "response") as model, patch.object(newsletter, "evolution") as evolution:
            first = newsletter.generate_images("image-test")
            second = newsletter.generate_images("image-test")
            self.assertEqual(first, second)
            self.assertEqual(len(first["image_assets"]), 3)
            model.assert_not_called()
            evolution.assert_not_called()
        with store.db() as c:
            self.assertEqual(c.execute("SELECT content FROM newsletters WHERE id='image-test'").fetchone()[0], "Texto original")
            self.assertEqual(c.execute("SELECT count(*) FROM deliveries").fetchone()[0], 0)
        with patch("main.newsletter.process_job"), TestClient(app) as client:
            self.assertEqual(client.post("/newsletter/image-test/images").status_code, 401)
            app.dependency_overrides[gateway.session] = lambda: {**USER, "admin": False}
            self.assertEqual(client.post("/newsletter/image-test/images").status_code, 403)
            app.dependency_overrides[gateway.session] = lambda: USER
            self.assertEqual(client.post("/newsletter/image-test/images").status_code, 200)

    def test_images_missing_edition_and_render_failure_preserve_text(self):
        with self.assertRaises(HTTPException) as error:
            newsletter.generate_images("missing")
        self.assertEqual(error.exception.status_code, 404)
        with store.db() as c:
            c.execute("INSERT INTO newsletters(id,week,status,period_start,period_end,content,articles,reading,created_at) VALUES(?,?,?,?,?,?,?,?,?)", ("render-test", "2026-43", "ready", "2026-10-15", "2026-10-22", "Original", '[{}]', "Síntese", store.now().isoformat()))
        with self.assertRaises(HTTPException):
            newsletter.generate_images("render-test")
        with store.db() as c:
            self.assertEqual(c.execute("SELECT status,content FROM newsletters WHERE id='render-test'").fetchone()["status"], "ready")
            self.assertEqual(c.execute("SELECT count(*) FROM image_assets").fetchone()[0], 0)

    def test_image_queue_deduplicates_both_modes_and_does_not_send(self):
        articles = [{"title": "Indústria no Ceará", "summary": "Resumo", "url": "https://example.com/noticia", "published_at": "2026-10-21"}]
        with store.db() as c:
            c.execute("INSERT INTO newsletters(id,week,status,period_start,period_end,content,articles,reading,created_at) VALUES(?,?,?,?,?,?,?,?,?)", ("queue-images", "2026-40", "ready", "2026-10-01", "2026-10-08", "Original", json.dumps(articles), "Síntese", store.now().isoformat()))
        first = newsletter.enqueue_images("queue-images", USER["id"], "free", True)
        second = newsletter.enqueue_images("queue-images", USER["id"], "ai", True)
        self.assertEqual(first["job_id"], second["job_id"])
        with patch("newsletter_images.requests.post") as api, patch.object(newsletter, "evolution") as send:
            newsletter.process_job()
            api.assert_not_called()
            send.assert_not_called()
        with store.db() as c:
            self.assertEqual(c.execute("SELECT status FROM generation_jobs WHERE id=?", (first["job_id"],)).fetchone()[0], "done")
            self.assertEqual(c.execute("SELECT count(*) FROM image_assets").fetchone()[0], 3)
            self.assertEqual(c.execute("SELECT content FROM newsletters WHERE id='queue-images'").fetchone()[0], "Original")

    def test_ai_failure_preserves_previous_cards_and_never_retries(self):
        articles = [{"title": "Indústria", "summary": "Resumo", "url": "https://example.com/noticia", "published_at": "2026-10-21"}]
        with store.db() as c:
            c.execute("INSERT INTO newsletters(id,week,status,period_start,period_end,content,articles,reading,created_at) VALUES(?,?,?,?,?,?,?,?,?)", ("ai-images", "2026-40", "ready", "2026-10-01", "2026-10-08", "Original", json.dumps(articles), "Síntese", store.now().isoformat()))
        original = newsletter.generate_images("ai-images")
        job = newsletter.enqueue_images("ai-images", USER["id"], "ai", True)
        with patch("newsletter_images.ai_illustration", side_effect=ValueError("Sem crédito")) as api:
            newsletter.process_job()
            newsletter.process_job()
            self.assertEqual(api.call_count, 1)
        with store.db() as c:
            self.assertEqual(c.execute("SELECT status FROM generation_jobs WHERE id=?", (job["job_id"],)).fetchone()[0], "failed")
            self.assertEqual(c.execute("SELECT content,status FROM newsletters WHERE id='ai-images'").fetchone()["content"], "Original")
        self.assertEqual(newsletter.generate_images("ai-images")["image_assets"], original["image_assets"])

    def test_ai_renderer_adds_typography_and_preserves_sources(self):
        articles = [{"title": "Indústria no Ceará", "summary": "Resumo", "url": "https://example.com/noticia", "published_at": "2026-10-21"}]
        with patch("newsletter_images.ai_illustration", return_value=Image.new("RGB", (1024, 1536), "#dce2cf")) as api:
            cards = render_cards(articles, "Síntese", date(2026, 10, 15), date(2026, 10, 22), {"image_mode": "ai"})
        self.assertEqual(api.call_count, 3)
        self.assertEqual(len(cards), 3)
        self.assertIn("Arte por IA", cards[1]["caption"])
        self.assertIn(articles[0]["url"], cards[1]["caption"])

    def test_image_api_contract_and_no_automatic_paid_retry(self):
        from newsletter_images import ai_illustration, ART_DIRECTION
        output = io.BytesIO()
        Image.new("RGB", (64, 64), "#dce2cf").save(output, format="PNG")
        with patch("newsletter_images.requests.post") as post:
            post.return_value.ok = True
            post.return_value.json.return_value = {"data": [{"b64_json": base64.b64encode(output.getvalue()).decode()}]}
            image = ai_illustration({"title": "Indústria no Ceará", "summary": "Resumo"})
            self.assertEqual(image.size, (1080, 1350))
            self.assertEqual(post.call_args.args[0], "https://api.openai.com/v1/images/generations")
            payload = post.call_args.kwargs["json"]
            self.assertEqual(payload["n"], 1)
            self.assertEqual(payload["size"], "1024x1280")
            self.assertEqual(payload["quality"], "high")
            self.assertIn(ART_DIRECTION, payload["prompt"])
            self.assertNotIn("test", payload["prompt"])
            post.return_value.ok = False
            post.return_value.status_code = 429
            with self.assertRaisesRegex(ValueError, "429"):
                ai_illustration({"title": "Indústria"})
            self.assertEqual(post.call_count, 2, "Uma chamada por tentativa, sem retry oculto")

    def test_blocked_ai_job_can_be_replaced_with_free_option(self):
        with store.db() as c:
            c.execute("INSERT INTO newsletters(id,week,status,period_start,period_end,created_at) VALUES(?,?,?,?,?,?)", ("blocked-images", "2026-40", "ready", "2026-10-01", "2026-10-08", store.now().isoformat()))
        first = newsletter.enqueue_images("blocked-images", USER["id"], "ai", True)
        with store.db() as c:
            c.execute("UPDATE generation_jobs SET status='blocked' WHERE id=?", (first["job_id"],))
        second = newsletter.enqueue_images("blocked-images", USER["id"], "free", True)
        self.assertNotEqual(first["job_id"], second["job_id"])
        with store.db() as c:
            self.assertEqual(c.execute("SELECT status FROM generation_jobs WHERE id=?", (first["job_id"],)).fetchone()[0], "failed")
            self.assertEqual(c.execute("SELECT status FROM generation_jobs WHERE id=?", (second["job_id"],)).fetchone()[0], "pending")

    def test_hasura_access_failure_does_not_consume_quota(self):
        with patch.object(agent, "load_schema", side_effect=HTTPException(503, "Configure JWT")), patch.object(agent, "response") as response:
            with self.assertRaises(HTTPException):
                agent.ask(USER, "request-hasura-denied", "Consulte boletos")
            response.assert_not_called()
        self.assertEqual(store.quota(USER["id"])["used"], 0)

    def test_server_secret_only_for_validated_admin_not_regular_user(self):
        with patch.dict(os.environ, {"HASURA_URL": "https://hasura.test", "HASURA_ADMIN_SECRET": "server-test-secret"}), patch.object(gateway.requests, "post") as post:
            post.return_value.ok = True
            post.return_value.json.return_value = {"data": {"ok": True}}
            gateway.hasura(USER, "query { __typename }")
            self.assertEqual(post.call_args.kwargs["headers"], {"x-hasura-admin-secret": "server-test-secret"})
            gateway.hasura({**USER, "admin": False}, "query { __typename }")
            self.assertEqual(post.call_args.kwargs["headers"], {"Authorization": USER["authorization"]})

    def test_sensitive_agent_fields_denied(self):
        for name in ("password_hash", "app_users", "admin_users", "api_key", "sindroupas_intelligence_requests"):
            self.assertTrue(agent.private_field(name))
        with patch.object(agent, "hasura") as hasura:
            with self.assertRaises(ValueError):
                agent.query_data(USER, SCHEMA, "query { app_users { id } }", {})
            hasura.assert_not_called()
        private_schema = build_schema("""
            type empresas { id: ID!, password_hash: String, owner: app_users }
            type app_users { id: ID!, password_hash: String }
            input app_users_bool_exp { _and: [app_users_bool_exp!], password_hash: String }
            type Query { empresas: [empresas!]!, app_users(where: app_users_bool_exp): [app_users!]! }
        """)
        with patch.object(agent, "hasura", return_value=introspection_from_schema(private_schema)):
            filtered = agent.load_schema(USER)
            self.assertEqual(validate_schema(filtered), [])
            self.assertNotIn("app_users", filtered.query_type.fields)
            self.assertNotIn("owner", filtered.get_type("empresas").fields)
            self.assertNotIn("password_hash", filtered.get_type("empresas").fields)

    def test_boleto_form_tool_only_prepares_navigation(self):
        args = {"empresa_id": "empresa-1", "tipo": "mensalidade", "periodicidade": "Mensal", "competencia": "2026-10", "vencimento": "2026-10-30", "valor_avulso": "", "motivo": ""}
        with patch.object(agent, "record_snapshot", return_value={"id": "empresa-1", "razao_social": "Empresa Alfa", "nome_fantasia": "Alfa"}), patch.object(agent, "hasura") as hasura:
            action = agent.boleto_form_action(USER, SCHEMA, args)
            self.assertEqual(action["kind"], "boleto_form")
            self.assertEqual(action["empresa_id"], "empresa-1")
            self.assertEqual(action["periodicidade"], "Mensal")
            hasura.assert_not_called()
            self.assertEqual(agent.boleto_form_action(USER, SCHEMA, {**args, "tipo": "avulso", "valor_avulso": "100.50"})["valor_avulso"], "100,50")
            with self.assertRaises(ValueError):
                agent.boleto_form_action(USER, SCHEMA, {**args, "tipo": "avulso", "valor_avulso": "1.000,00"})
            with self.assertRaises(ValueError):
                agent.boleto_form_action(USER, SCHEMA, {**args, "competencia": "outubro"})
        with patch.object(agent, "record_snapshot", return_value=None), self.assertRaises(ValueError):
            agent.boleto_form_action(USER, SCHEMA, args)


if __name__ == "__main__":
    unittest.main()
