"""Foto editorial opcional extraída da própria matéria. Sem cookies, proxies ou rede privada."""
import http.client
import io
import ipaddress
import json
import socket
import ssl
import time
from dataclasses import dataclass
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit

from PIL import Image, ImageOps, UnidentifiedImageError


class MediaUnavailable(ValueError):
    pass


def public_target(url):
    try:
        parsed = urlsplit(url)
        if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password or parsed.port not in (None, 443) or len(url) > 3000:
            raise MediaUnavailable("Somente fontes HTTPS públicas.")
        host = parsed.hostname.encode("idna").decode("ascii")
        if host == "localhost" or host.endswith((".localhost", ".local", ".internal")):
            raise MediaUnavailable("Endereço interno bloqueado.")
        addresses = list(dict.fromkeys(item[4][0] for item in socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM)))
        if not addresses or any(not ipaddress.ip_address(address).is_global for address in addresses):
            raise MediaUnavailable("Endereço de rede não público bloqueado.")
        return host, addresses[0], (parsed.path or "/") + ("?"+parsed.query if parsed.query else "")
    except (OSError, UnicodeError, ValueError) as exc:
        raise MediaUnavailable("Não foi possível validar o endereço público.") from exc


class PinnedHTTPSConnection(http.client.HTTPSConnection):
    """Conecta ao IP público já validado, mantendo SNI/certificado do hostname original."""
    def __init__(self, host, address, timeout):
        super().__init__(host, 443, timeout=timeout, context=ssl.create_default_context())
        self.address = address

    def connect(self):
        raw = socket.create_connection((self.address, 443), timeout=self.timeout)
        try:
            self.sock = self._context.wrap_socket(raw, server_hostname=self.host)
        except Exception:
            raw.close()
            raise


def fetch_public(url, image=False):
    deadline = time.monotonic()+15
    limit = 8_000_000 if image else 2_000_000
    for _ in range(4):
        host, address, path = public_target(url)
        remaining = deadline-time.monotonic()
        if remaining <= 0:
            raise MediaUnavailable("Tempo limite da fonte excedido.")
        connection = PinnedHTTPSConnection(host, address, min(6, remaining))
        try:
            connection.request("GET", path, headers={"User-Agent": "SindRoupas-Radar/1.0", "Accept-Encoding": "identity", "Accept": "image/png,image/jpeg,image/webp" if image else "text/html"})
            response = connection.getresponse()
            if response.status in (301, 302, 303, 307, 308):
                destination = response.getheader("Location")
                if not destination:
                    raise MediaUnavailable("Redirecionamento sem destino.")
                url = urljoin(url, destination)
                continue  # Cada destino é validado e conectado ao IP verificado.
            content_type = (response.getheader("Content-Type") or "").split(";")[0].strip().lower()
            allowed = {"image/png", "image/jpeg", "image/webp"} if image else {"text/html", "application/xhtml+xml"}
            length = response.getheader("Content-Length")
            if response.status != 200 or content_type not in allowed or response.getheader("Content-Encoding", "identity").lower() != "identity" or length and int(length) > limit:
                raise MediaUnavailable("A fonte não disponibilizou uma imagem/matéria utilizável.")
            chunks, size = [], 0
            while True:
                if time.monotonic() > deadline:
                    raise MediaUnavailable("Tempo limite da fonte excedido.")
                chunk = response.read(min(65536, limit-size+1))
                if not chunk:
                    return b"".join(chunks), url
                size += len(chunk)
                if size > limit:
                    raise MediaUnavailable("Conteúdo da fonte excede o limite.")
                chunks.append(chunk)
        except (OSError, http.client.HTTPException, ValueError) as exc:
            raise MediaUnavailable("A fonte não pôde ser carregada com segurança.") from exc
        finally:
            connection.close()
    raise MediaUnavailable("Redirecionamentos demais.")


class ArticleMetadata(HTMLParser):
    def __init__(self):
        super().__init__()
        self.meta = {}
        self.structured = []
        self._script = None

    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if tag == "meta":
            key = (data.get("property") or data.get("name") or "").lower()
            if key and data.get("content"):
                self.meta.setdefault(key, data["content"])
        if tag == "script" and data.get("type", "").lower() == "application/ld+json":
            self._script = ""

    def handle_data(self, value):
        if self._script is not None and len(self._script) < 150000:
            self._script += value

    def handle_endtag(self, tag):
        if tag == "script" and self._script is not None:
            try:
                self.structured.append(json.loads(self._script))
            except ValueError:
                pass
            self._script = None


def image_credit(value, target):
    if isinstance(value, list):
        return next((credit for item in value if (credit := image_credit(item, target))), "")
    if not isinstance(value, dict):
        return ""
    if value.get("@type") == "ImageObject" and (value.get("url") == target or value.get("contentUrl") == target):
        credit = value.get("creditText") or value.get("copyrightNotice")
        if isinstance(credit, str):
            return " ".join(credit.split())[:240]
    return next((credit for item in value.values() if isinstance(item, (dict, list)) and (credit := image_credit(item, target))), "")


@dataclass
class SourcePhoto:
    image: Image.Image
    url: str
    credit: str
    source_url: str


def article_photo(article):
    """Só chamar com autorização editorial habilitada. Falha retorna ilustração, não interrompe a edição."""
    try:
        html, source_url = fetch_public(article["url"])
        metadata = ArticleMetadata()
        metadata.feed(html.decode("utf-8", errors="replace"))
        candidate = metadata.meta.get("og:image:secure_url") or metadata.meta.get("og:image") or metadata.meta.get("twitter:image")
        if not candidate:
            return None
        url = urljoin(source_url, candidate)
        content, final_url = fetch_public(url, image=True)
        with Image.open(io.BytesIO(content)) as image:
            if image.format not in ("PNG", "JPEG", "WEBP") or image.width < 400 or image.height < 250 or image.width*image.height > 16_000_000 or getattr(image, "is_animated", False):
                return None
            photo = ImageOps.exif_transpose(image).convert("RGB")
        credit = image_credit(metadata.structured, url) or image_credit(metadata.structured, final_url)
        if not credit:
            credit = f"Foto publicada em {urlsplit(source_url).hostname} · autoria não informada"
        return SourcePhoto(photo, final_url, credit, source_url)
    except (MediaUnavailable, OSError, ValueError, KeyError, RecursionError, Image.DecompressionBombError, UnidentifiedImageError):
        return None
