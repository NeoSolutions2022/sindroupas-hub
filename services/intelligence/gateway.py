import os

import requests
from fastapi import Header, HTTPException


def env(name):
    value = os.environ.get(name, "").strip() or ("gpt-6.1-sol" if name in ("OPENAI_MODEL", "NEWSLETTER_MODEL") else "")
    if not value:
        raise HTTPException(503, f"Serviço ainda não configurado: {name}.")
    return value


def normalize_user(payload):
    user = payload.get("user") if isinstance(payload, dict) and "user" in payload else payload
    if not isinstance(user, dict) or not isinstance(user.get("id"), (str, int)) or isinstance(user.get("id"), bool) or not str(user["id"]).strip():
        raise HTTPException(503, "Resposta inválida do serviço de autenticação. Não foi possível identificar o usuário.")
    status = str(user.get("status") or "").strip().lower()
    if user.get("is_active") is False or status in ("inactive", "inativo", "disabled", "blocked", "bloqueado"):
        raise HTTPException(401, "Usuário não está ativo. Contate o administrador.")
    if status not in ("active", "ativo") and not (not status and user.get("is_active") is True):
        raise HTTPException(503, "Resposta inválida do serviço de autenticação: estado do usuário não confirmado.")
    return user


def session(authorization: str = Header(default="")):
    if not authorization.startswith("Bearer ") or len(authorization) > 16000:
        raise HTTPException(401, "Entre novamente para usar o assistente.")
    try:
        r = requests.get(f"{env('AUTH_URL').rstrip('/')}/auth/me", headers={"Authorization": authorization}, timeout=15)
        if r.status_code in (401, 403):
            raise HTTPException(401, "Sessão inválida ou expirada.")
        if r.status_code != 200:
            raise HTTPException(503, "Não foi possível validar sua sessão no serviço de autenticação.")
        user = normalize_user(r.json())
        return {"id": str(user["id"]), "admin": str(user.get("role", "")).lower() == "admin", "authorization": authorization}
    except (requests.RequestException, ValueError):
        raise HTTPException(503, "Não foi possível validar sua sessão.")


def admin(user):
    if not user["admin"]:
        raise HTTPException(403, "Somente administradores podem gerenciar a newsletter.")


def hasura(user, query, variables=None):
    # Não usar segredo administrativo. O Hasura revalida a sessão e seu papel em cada chamada.
    try:
        r = requests.post(env("HASURA_URL"), json={"query": query, "variables": variables or {}},
                          headers={"Authorization": user["authorization"]}, timeout=25)
        body = r.json()
        if not r.ok or body.get("errors"):
            raise HTTPException(422, "Consulta não autorizada ou inválida no Hasura: " + str(body.get("errors", r.status_code))[:1200])
        return body["data"]
    except (requests.RequestException, ValueError, KeyError):
        raise HTTPException(502, "Falha de comunicação com o Hasura. Confira o resultado antes de repetir uma escrita.")


def response(payload, newsletter=False):
    model = env("NEWSLETTER_MODEL") if newsletter else env("OPENAI_MODEL")
    try:
        r = requests.post("https://api.openai.com/v1/responses", headers={"Authorization": f"Bearer {env('OPENAI_API_KEY')}"},
                          json={"model": model, "store": False, **payload}, timeout=180)
        if not r.ok:
            raise HTTPException(502, f"A geração pela OpenAI falhou (HTTP {r.status_code}).")
        data = r.json()
        if data.get("status") != "completed":
            raise HTTPException(502, "A geração não foi concluída. Nenhuma escrita foi executada.")
        return data
    except (requests.RequestException, ValueError):
        raise HTTPException(502, "A geração foi interrompida. Nenhuma nova escrita foi executada.")


def output_text(data):
    return "\n".join(part.get("text", "") for item in data.get("output", []) if item.get("type") == "message"
                     for part in item.get("content", []) if part.get("type") == "output_text")
