import asyncio
import json
import os
from contextlib import asynccontextmanager, suppress
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import agent
import newsletter
from gateway import admin, env, session
from store import db, init, now, quota, settings


async def scheduler():
    while True:
        config = settings()
        current = now()
        try:
            if newsletter.schedule_due(config, current):
                await asyncio.to_thread(newsletter.enqueue, "scheduler")
            await asyncio.to_thread(newsletter.process_job)
        except Exception:
            pass  # A fila e as edições persistem no PostgreSQL para inspeção.
        await asyncio.sleep(30)


@asynccontextmanager
async def lifespan(_app):
    init()
    # Uma réplica e um worker. Não repetir operações com resultado desconhecido.
    with db() as c:
        c.execute("UPDATE generation_jobs SET status='failed',error='Serviço reiniciado durante a geração; revise a edição antes de tentar novamente.' WHERE status='running'")
        c.execute("UPDATE proposals SET status='uncertain',result=? WHERE status='executing'", (json.dumps({"error": "Serviço reiniciado durante a execução. Confira o registro antes de tentar outra alteração."}),))
        c.execute("UPDATE newsletters SET status='failed',error='Geração interrompida por reinício. É possível tentar novamente.' WHERE status='generating'")
        c.execute("UPDATE deliveries SET status='uncertain',error='Envio interrompido. Confira o WhatsApp antes de qualquer reenvio.' WHERE status='sending'")
        c.execute("UPDATE requests SET status='done',result=? WHERE status='running'", (json.dumps({"answer": "Solicitação interrompida por reinício. Nenhuma proposta pendente foi executada automaticamente.", "proposals": []}),))
    task = asyncio.create_task(scheduler())
    yield
    task.cancel()
    with suppress(asyncio.CancelledError):
        await task


app = FastAPI(title="SindRoupas • Inteligência", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=[origin.strip() for origin in os.environ.get("CORS_ORIGINS", "").split(",") if origin.strip()],
                   allow_methods=["GET", "POST", "PUT"], allow_headers=["Authorization", "Content-Type"])


class ChatInput(BaseModel):
    request_id: str = Field(pattern=r"^[a-zA-Z0-9-]{16,80}$")
    message: str = Field(min_length=1, max_length=5000)


class Decision(BaseModel):
    approve: bool


class NewsletterSettings(BaseModel):
    enabled: bool = False
    time: str = Field(default="09:00", pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")
    destination_type: Literal["number", "group"] = "number"
    number: str = Field(default="", max_length=80)
    cta_label: str = Field(default="Fale com o SindRoupas", max_length=100)
    cta_url: str = Field(default="", max_length=1000)
    notes: str = Field(default="", max_length=6000)
    source_links: list[str] = Field(default_factory=list, max_length=30)
    photo_url: str = Field(default="", max_length=1500)
    photo_urls: list[str] = Field(default_factory=list, max_length=5)
    photo_caption: str = Field(default="", max_length=1000)
    images_enabled: bool = False
    image_mode: Literal["free", "ai"] = "free"
    source_photos_enabled: bool = False


class ImageGeneration(BaseModel):
    mode: Literal["free", "ai"] = "free"
    refresh: bool = False


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/agent/history")
def chat_history(user=Depends(session)):
    with db() as c:
        rows = c.execute("SELECT * FROM requests WHERE user_id=? ORDER BY created_at DESC LIMIT 20", (user["id"],)).fetchall()
        items = []
        for row in reversed(rows):
            result = json.loads(row["result"] or "{}")
            proposals = c.execute("SELECT * FROM proposals WHERE request_id=? AND user_id=? ORDER BY created_at", (row["id"], user["id"])).fetchall()
            items.append({"request_id": row["id"], "message": row["message"], "answer": result.get("answer", "Em processamento…"), "actions": result.get("actions", []),
                          "proposals": [{"id": p["id"], "status": p["status"], "result": json.loads(p["result"] or "null"), **json.loads(p["payload"])} for p in proposals]})
    return {"items": items, "quota": quota(user["id"])}


@app.post("/agent/chat")
def chat(body: ChatInput, user=Depends(session)):
    env("OPENAI_API_KEY")
    env("OPENAI_MODEL")
    env("HASURA_URL")
    return agent.ask(user, body.request_id, body.message.strip())


@app.post("/agent/proposals/{proposal_id}/decision")
def decide(proposal_id: str, body: Decision, user=Depends(session)):
    return agent.decide(user, proposal_id, body.approve)


@app.get("/newsletter")
def newsletter_state(user=Depends(session)):
    admin(user)
    with db() as c:
        jobs = [dict(row) for row in c.execute("SELECT * FROM generation_jobs ORDER BY created_at DESC LIMIT 10").fetchall()]
    return {"settings": settings(), "editions": newsletter.history(), "jobs": jobs, "model": env("NEWSLETTER_MODEL")}


@app.put("/newsletter/settings")
def save_settings(body: NewsletterSettings, user=Depends(session)):
    admin(user)
    config = body.model_dump()
    try:
        newsletter.destination(config)
        for link in [body.cta_url, body.photo_url, *body.source_links, *body.photo_urls]:
            if link and not newsletter.public_url(link):
                raise ValueError("Informe links HTTPS válidos para fontes, foto e CTA.")
        if body.cta_url and not body.cta_label.strip():
            raise ValueError("Informe o texto do CTA.")
    except ValueError as exc:
        raise HTTPException(422, str(exc))
    if body.enabled:
        env("OPENAI_API_KEY")
        env("NEWSLETTER_MODEL")
    if body.number:
        for key in ("EVOLUTION_API_URL", "EVOLUTION_INSTANCE", "EVOLUTION_API_KEY"):
            env(key)
    with db() as c:
        c.execute("UPDATE settings SET value=? WHERE id=1", (json.dumps(config, ensure_ascii=False),))
    return config


@app.post("/newsletter/generate")
def generate(user=Depends(session)):
    admin(user)
    return newsletter.enqueue(user["id"])


@app.post("/newsletter/{newsletter_id}/send")
def send(newsletter_id: str, user=Depends(session)):
    admin(user)
    return newsletter.send(newsletter_id)


@app.post("/newsletter/{newsletter_id}/images")
def generate_edition_images(newsletter_id: str, body: ImageGeneration | None = None, user=Depends(session)):
    admin(user)
    options = body or ImageGeneration()
    return newsletter.enqueue_images(newsletter_id, user["id"], options.mode, options.refresh)


@app.post("/newsletter/{newsletter_id}/retry")
def retry(newsletter_id: str, user=Depends(session)):
    admin(user)
    env("OPENAI_API_KEY")
    env("NEWSLETTER_MODEL")
    week = f"{now().isocalendar().year}-{now().isocalendar().week:02d}"
    with db() as c:
        row = c.execute("SELECT status,week FROM newsletters WHERE id=?", (newsletter_id,)).fetchone()
        if not row or row["week"] != week or row["status"] != "failed":
            raise HTTPException(409, "Só é possível repetir a geração de uma edição falhada da semana atual.")
    return newsletter.enqueue(user["id"], newsletter_id)


@app.get("/newsletter/images/{asset_id}")
def newsletter_image(asset_id: str, user=Depends(session)):
    admin(user)
    with db() as c:
        row = c.execute("SELECT content,content_type FROM image_assets WHERE id=?", (asset_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Imagem não encontrada.")
    return Response(content=bytes(row["content"]), media_type=row["content_type"], headers={"Cache-Control": "private, no-store"})


@app.get("/newsletter/groups")
def list_groups(user=Depends(session)):
    admin(user)
    try:
        return newsletter.groups()
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(502, "Não foi possível consultar os grupos da instância Evolution configurada.")
