import json
import os
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

TZ = ZoneInfo("America/Fortaleza")


def now():
    return datetime.now(TZ)


def uid():
    return str(uuid.uuid4())


@contextmanager
def db():
    path = os.environ.get("DATA_PATH", "/data/intelligence.sqlite")
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path, timeout=15, isolation_level=None)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        yield conn
    finally:
        conn.close()


def init():
    with db() as c:
        c.executescript("""
        CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK(id=1), value TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS requests (
          id TEXT PRIMARY KEY, user_id TEXT NOT NULL, day TEXT NOT NULL, message TEXT NOT NULL,
          status TEXT NOT NULL, result TEXT, created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS requests_quota ON requests(user_id,day);
        CREATE TABLE IF NOT EXISTS proposals (
          id TEXT PRIMARY KEY, request_id TEXT NOT NULL REFERENCES requests(id), user_id TEXT NOT NULL,
          status TEXT NOT NULL, payload TEXT NOT NULL, result TEXT, created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS newsletters (
          id TEXT PRIMARY KEY, week TEXT UNIQUE NOT NULL, status TEXT NOT NULL, period_start TEXT NOT NULL,
          period_end TEXT NOT NULL, content TEXT, articles TEXT, error TEXT, created_at TEXT NOT NULL,
          completed_at TEXT, media TEXT
        );
        CREATE TABLE IF NOT EXISTS deliveries (
          id TEXT PRIMARY KEY, newsletter_id TEXT NOT NULL REFERENCES newsletters(id), number TEXT NOT NULL,
          status TEXT NOT NULL, error TEXT, created_at TEXT NOT NULL,
          UNIQUE(newsletter_id,number)
        );
        """)
        if "media" not in {column[1] for column in c.execute("PRAGMA table_info(newsletters)")}:
            c.execute("ALTER TABLE newsletters ADD COLUMN media TEXT")
        c.execute("INSERT OR IGNORE INTO settings VALUES (1,?)", (json.dumps({
            "enabled": False, "time": "09:00", "number": "", "cta_label": "Fale com o SindRoupas",
            "cta_url": "", "notes": "", "photo_url": "", "photo_caption": "",
        }),))


def settings():
    with db() as c:
        return json.loads(c.execute("SELECT value FROM settings WHERE id=1").fetchone()[0])


def quota(user_id):
    with db() as c:
        used = c.execute("SELECT count(*) FROM requests WHERE user_id=? AND day=?", (user_id, now().date().isoformat())).fetchone()[0]
    return {"used": used, "limit": 3, "remaining": max(0, 3-used), "day": now().date().isoformat()}
