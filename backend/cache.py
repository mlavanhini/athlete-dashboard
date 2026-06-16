import json
import time
import logging
import aiosqlite
from config import settings

logger = logging.getLogger(__name__)

_db: aiosqlite.Connection | None = None

async def init_cache():
    global _db
    _db = await aiosqlite.connect(settings.cache_db)
    await _db.execute("""
        CREATE TABLE IF NOT EXISTS cache (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            expires_at REAL NOT NULL,
            created_at REAL NOT NULL
        )
    """)
    await _db.commit()
    logger.info(f"Cache initialized at {settings.cache_db}")

async def close_cache():
    global _db
    if _db:
        await _db.close()

async def get_cached(key: str) -> tuple[dict | list | None, bool]:
    """Returns (data, is_stale). is_stale=True means data exists but TTL expired."""
    if not _db:
        return None, False
    now = time.time()
    async with _db.execute(
        "SELECT value, expires_at FROM cache WHERE key = ?", (key,)
    ) as cur:
        row = await cur.fetchone()
    if not row:
        return None, False
    data = json.loads(row[0])
    is_stale = now > row[1]
    return data, is_stale

async def set_cached(key: str, value: dict | list, ttl: int | None = None):
    if not _db:
        return
    if ttl is None:
        ttl = settings.cache_ttl_default
    now = time.time()
    await _db.execute(
        "INSERT OR REPLACE INTO cache (key, value, expires_at, created_at) VALUES (?, ?, ?, ?)",
        (key, json.dumps(value), now + ttl, now)
    )
    await _db.commit()

async def invalidate(key: str):
    if not _db:
        return
    await _db.execute("DELETE FROM cache WHERE key = ?", (key,))
    await _db.commit()
