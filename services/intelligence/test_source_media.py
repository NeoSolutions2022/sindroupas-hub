import io
import socket
import unittest
from unittest.mock import Mock, patch

from PIL import Image

import source_media as media
from newsletter_images import ART_DIRECTION, ai_illustration, card_copy, render_cards
from datetime import date


class SourceMediaTests(unittest.TestCase):
    def test_private_addresses_credentials_and_protocols_are_blocked(self):
        for value in ("http://example.com/x", "https://user:password@example.com/x", "https://example.com:8080/x", "file:///etc/passwd", "https://localhost/x", "https://x.local/x"):
            with self.subTest(value=value), self.assertRaises(media.MediaUnavailable):
                media.public_target(value)
        for address in ("127.0.0.1", "10.0.0.1", "169.254.169.254", "192.168.1.1", "::1", "fd00::1", "::ffff:127.0.0.1"):
            with patch.object(socket, "getaddrinfo", return_value=[(None, None, None, None, (address, 443))]), self.assertRaises(media.MediaUnavailable):
                media.public_target("https://example.com/photo.jpg")

    def test_public_address_is_pinned_not_resolved_twice(self):
        with patch.object(socket, "getaddrinfo", return_value=[(None, None, None, None, ("8.8.8.8", 443))]):
            self.assertEqual(media.public_target("https://example.com/photo.jpg?a=1"), ("example.com", "8.8.8.8", "/photo.jpg?a=1"))
        connection = media.PinnedHTTPSConnection("example.com", "8.8.8.8", 6)
        with patch.object(socket, "create_connection") as create, patch.object(connection._context, "wrap_socket") as wrap:
            connection.connect()
            create.assert_called_once_with(("8.8.8.8", 443), timeout=6)
            wrap.assert_called_once_with(create.return_value, server_hostname="example.com")

    def test_redirects_are_revalidated_before_connecting(self):
        response = Mock(status=302)
        response.getheader.side_effect = lambda key, default=None: "https://127.0.0.1/private" if key == "Location" else default
        with patch.object(media, "public_target", side_effect=[("example.com", "8.8.8.8", "/"), media.MediaUnavailable("Privado")]) as validate, patch.object(media, "PinnedHTTPSConnection") as connection:
            connection.return_value.getresponse.return_value = response
            with self.assertRaises(media.MediaUnavailable):
                media.fetch_public("https://example.com/")
            self.assertEqual(connection.call_count, 1)
            self.assertEqual(validate.call_count, 2)

    def test_oversized_or_non_raster_response_is_rejected(self):
        for content_type, length in (("image/svg+xml", "100"), ("image/jpeg", "8000001")):
            response = Mock(status=200)
            headers = {"Content-Type": content_type, "Content-Length": length}
            response.getheader.side_effect = lambda key, default=None: headers.get(key, default)
            with patch.object(media, "public_target", return_value=("example.com", "8.8.8.8", "/photo")), patch.object(media, "PinnedHTTPSConnection") as connection:
                connection.return_value.getresponse.return_value = response
                with self.assertRaises(media.MediaUnavailable):
                    media.fetch_public("https://example.com/photo", image=True)
                response.read.assert_not_called()

    def test_photo_is_discovered_in_original_page_and_credit_preserved(self):
        html = b'<meta property="og:image" content="/foto.jpg"><script type="application/ld+json">{"image":{"@type":"ImageObject","url":"https://portal.example/foto.jpg","creditText":"Foto: Equipe do portal"}}</script>'
        output = io.BytesIO()
        Image.new("RGB", (900, 600), "#CDD8BE").save(output, format="JPEG")
        with patch.object(media, "fetch_public", side_effect=[(html, "https://portal.example/noticia"), (output.getvalue(), "https://portal.example/foto.jpg")]) as fetch:
            photo = media.article_photo({"url": "https://portal.example/noticia"})
        self.assertEqual(photo.credit, "Foto: Equipe do portal")
        self.assertEqual(photo.image.size, (900, 600))
        self.assertEqual(fetch.call_args_list[1].args[0], "https://portal.example/foto.jpg")

    def test_author_is_not_invented_and_failures_are_optional(self):
        output = io.BytesIO()
        Image.new("RGB", (900, 600)).save(output, format="PNG")
        html = b'<meta property="og:image" content="https://portal.example/foto.png"><meta name="author" content="Autor da materia, nao da foto">'
        with patch.object(media, "fetch_public", side_effect=[(html, "https://portal.example/noticia"), (output.getvalue(), "https://portal.example/foto.png")]):
            photo = media.article_photo({"url": "https://portal.example/noticia"})
            self.assertIn("autoria não informada", photo.credit)
            self.assertNotIn("Autor da materia", photo.credit)
        for html in (b"<html>Sem foto</html>", b'<meta property="og:image" content="https://private.example/x">'):
            with patch.object(media, "fetch_public", side_effect=[(html, "https://portal.example/noticia"), media.MediaUnavailable("Bloqueado")]):
                self.assertIsNone(media.article_photo({"url": "https://portal.example/noticia"}))

    def test_context_is_independent_from_news_title_and_legacy_is_supported(self):
        headline, context = card_copy({"title": "Título original", "summary": "Fato salvo", "card_headline": "Renda de bilro une universidade e artesãs no Ceará", "card_context": "A parceria aproxima pesquisa acadêmica dos saberes tradicionais das rendeiras."})
        self.assertNotEqual(headline, "Título original")
        self.assertIn("parceria", context)
        self.assertEqual(card_copy({"title": "Título antigo", "summary": "Contexto antigo"}), ("Título antigo", "Contexto antigo"))

    def test_photo_option_off_does_not_make_network_requests(self):
        article = {"title": "Renda de bilro", "summary": "Universidade e artesãs trocam saberes no Ceará.", "url": "https://portal.example/noticia", "published_at": "2026-10-21"}
        with patch("newsletter_images.article_photo") as fetch:
            cards = render_cards([article], "Síntese", date(2026, 10, 15), date(2026, 10, 22), {"image_mode": "free"})
            fetch.assert_not_called()
        self.assertIn(article["summary"], cards[1]["caption"])
        self.assertEqual(Image.open(io.BytesIO(cards[1]["content"])).size, (1080, 1350))

    def test_premium_ai_receives_photo_and_is_not_overwritten_with_free_template(self):
        article = {"title": "Renda de bilro", "summary": "Universidade e artesãs trocam saberes no Ceará.", "url": "https://portal.example/noticia", "published_at": "2026-10-21"}
        photo = media.SourcePhoto(Image.new("RGB", (900, 600)), "https://portal.example/foto.png", "Foto: Equipe", article["url"])
        with patch("newsletter_images.article_photo", return_value=photo), patch("newsletter_images.ai_illustration", return_value=Image.new("RGB", (1024, 1536))) as generate:
            cards = render_cards([article], "Síntese", date(2026, 10, 15), date(2026, 10, 22), {"image_mode": "ai", "source_photos_enabled": True})
        self.assertEqual(generate.call_count, 3)
        payload = generate.call_args_list[1].args[0]
        self.assertTrue(payload["has_source_photo"])
        self.assertNotIn("image", payload)
        self.assertNotIn("photo_url", payload)
        self.assertEqual(generate.call_args_list[1].kwargs["photo"], photo)
        self.assertEqual(payload["post_copy"]["headline"], article["title"])
        # Imagem simulada preta segue preta: o renderer não desenha caixas/textos sobre a arte IA.
        self.assertEqual(Image.open(io.BytesIO(cards[1]["content"])).getpixel((100, 800)), (0, 0, 0))
        self.assertIn("Foto: Equipe", cards[1]["caption"])
        self.assertIn(photo.url, cards[1]["caption"])
        self.assertIn("#FF2F92", ART_DIRECTION)

    def test_photo_reference_uses_image_edit_api_without_portal_credentials(self):
        output = io.BytesIO()
        Image.new("RGB", (64, 80)).save(output, format="PNG")
        photo = media.SourcePhoto(Image.new("RGB", (900, 600)), "https://portal.example/foto.png", "Foto: Equipe", "https://portal.example/noticia")
        import base64
        import os
        with patch.dict(os.environ, {"OPENAI_API_KEY": "qa-key"}), patch("newsletter_images.requests.post") as post:
            post.return_value.ok = True
            post.return_value.json.return_value = {"data": [{"b64_json": base64.b64encode(output.getvalue()).decode()}]}
            result = ai_illustration({"title": "Contexto", "post_copy": {"headline": "Chamada exata", "context": "Contexto exato"}}, photo=photo)
        self.assertEqual(result.size, (1080, 1350))
        self.assertEqual(post.call_args.args[0], "https://api.openai.com/v1/images/edits")
        kwargs = post.call_args.kwargs
        self.assertNotIn("json", kwargs)
        self.assertEqual(kwargs["data"]["quality"], "high")
        self.assertEqual(kwargs["files"]["image[]"][2], "image/png")
        self.assertNotIn("qa-key", kwargs["data"]["prompt"])
        self.assertNotIn("cookies", kwargs)


if __name__ == "__main__":
    unittest.main()
