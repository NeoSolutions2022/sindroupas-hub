import json
import os
import uuid
from contextlib import contextmanager
from datetime import datetime
from zoneinfo import ZoneInfo

import psycopg
from psycopg.rows import dict_row

TZ = ZoneInfo("America/Fortaleza")


def now():
    return datetime.now(TZ)


def uid():
    return str(uuid.uuid4())


class Record(dict):
    def __getitem__(self, key):
        return super().__getitem__(list(self.keys())[key] if isinstance(key, int) else key)


class Result:
    def __init__(self, cursor):
        self.cursor = cursor

    def fetchone(self):
        row = self.cursor.fetchone()
        return Record(row) if row is not None else None

    def fetchall(self):
        return [Record(row) for row in self.cursor.fetchall()]


class Connection:
    def __init__(self, connection):
        self.connection = connection

    def execute(self, sql, params=None):
        if sql.strip() == "BEGIN IMMEDIATE":
            self.connection.execute("BEGIN")
            # Seções críticas curtas: cota, claim da proposta e deduplicação da edição/envio.
            return Result(self.connection.execute("SELECT pg_advisory_xact_lock(60161022)"))
        return Result(self.connection.execute(sql.replace("?", "%s"), params))

    def commit(self):
        self.connection.commit()

    def rollback(self):
        self.connection.rollback()


@contextmanager
def db():
    url = os.environ.get("DATABASE_URL", "").strip()
    if not url:
        raise RuntimeError("Configure DATABASE_URL com o PostgreSQL da fonte do Hasura.")
    conn = psycopg.connect(url, autocommit=True, row_factory=dict_row, connect_timeout=10,
                           options="-c search_path=sindroupas_intelligence,pg_catalog -c statement_timeout=30000")
    try:
        yield Connection(conn)
    finally:
        conn.close()


def init():
    with db() as c:
        missing = c.execute("SELECT name FROM unnest(ARRAY['settings','requests','proposals','newsletters','deliveries','image_assets','generation_jobs']) AS name WHERE to_regclass('sindroupas_intelligence.' || name) IS NULL").fetchall()
        if missing:
            raise RuntimeError("Aplique docs/sql/2026-10-22-intelligence-postgres.sql no banco do Hasura antes de iniciar o serviço.")
        if not c.execute("SELECT id FROM settings WHERE id=1").fetchone():
            raise RuntimeError("Configuração inicial ausente. Reaplique o SQL da inteligência.")


def settings():
    with db() as c:
        return json.loads(c.execute("SELECT value FROM settings WHERE id=1").fetchone()[0])


def quota(user_id):
    with db() as c:
        used = c.execute("SELECT count(*) FROM requests WHERE user_id=? AND day=?", (user_id, now().date().isoformat())).fetchone()[0]
    return {"used": used, "limit": 3, "remaining": max(0, 3-used), "day": now().date().isoformat()}
