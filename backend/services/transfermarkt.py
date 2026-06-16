import asyncio
import logging
import re
import httpx
from config import settings
from cache import get_cached, set_cached

logger = logging.getLogger(__name__)

_client: httpx.AsyncClient | None = None
_last_request_time: float = 0.0

async def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(
            base_url=settings.tm_api_url,
            timeout=30.0,
            headers={"User-Agent": "soccer-finance-dashboard/1.0"}
        )
    return _client

async def close_client():
    global _client
    if _client and not _client.is_closed:
        await _client.aclose()

async def _throttled_get(path: str) -> dict | list | None:
    global _last_request_time
    import time
    now = time.time()
    wait = settings.rate_limit_delay - (now - _last_request_time)
    if wait > 0:
        await asyncio.sleep(wait)

    client = await get_client()
    try:
        resp = await client.get(path)
        _last_request_time = time.time()
        resp.raise_for_status()
        return resp.json()
    except httpx.HTTPStatusError as e:
        logger.warning(f"TM API HTTP error {e.response.status_code} for {path}")
        return None
    except Exception as e:
        logger.error(f"TM API error for {path}: {e}")
        return None

async def _cached_get(cache_key: str, path: str, ttl: int | None = None) -> tuple[dict | list | None, bool, bool]:
    """Returns (data, from_cache, is_stale)."""
    data, is_stale = await get_cached(cache_key)
    if data is not None and not is_stale:
        return data, True, False

    fresh = await _throttled_get(path)
    if fresh is not None:
        await set_cached(cache_key, fresh, ttl)
        return fresh, False, False

    # Source failed — return stale cache if available
    if data is not None:
        return data, True, True
    return None, False, False

async def search_players(name: str, page: int = 1) -> tuple[list[dict], bool, bool]:
    key = f"tm:search:player:{name}:{page}"
    path = f"/players/search/{name}?page_number={page}"
    data, cached, stale = await _cached_get(key, path, ttl=3600)
    if data and isinstance(data, dict):
        results = data.get("results", [])
        return results, cached, stale
    return [], cached, stale

async def get_player_profile(player_id: str) -> tuple[dict | None, bool, bool]:
    key = f"tm:player:profile:{player_id}"
    data, cached, stale = await _cached_get(key, f"/players/{player_id}/profile")
    return data, cached, stale

async def get_player_market_value(player_id: str) -> tuple[dict | None, bool, bool]:
    key = f"tm:player:mv:{player_id}"
    data, cached, stale = await _cached_get(key, f"/players/{player_id}/market_value")
    return data, cached, stale

async def get_player_transfers(player_id: str) -> tuple[dict | None, bool, bool]:
    key = f"tm:player:transfers:{player_id}"
    data, cached, stale = await _cached_get(key, f"/players/{player_id}/transfers")
    return data, cached, stale

async def get_player_stats(player_id: str) -> tuple[dict | None, bool, bool]:
    key = f"tm:player:stats:{player_id}"
    data, cached, stale = await _cached_get(key, f"/players/{player_id}/stats")
    return data, cached, stale

async def search_clubs(name: str, page: int = 1) -> tuple[list[dict], bool, bool]:
    key = f"tm:search:club:{name}:{page}"
    path = f"/clubs/search/{name}?page_number={page}"
    data, cached, stale = await _cached_get(key, path, ttl=3600)
    if data and isinstance(data, dict):
        return data.get("results", []), cached, stale
    return [], cached, stale

async def get_club_players(club_id: str, season_id: str | None = None) -> tuple[dict | None, bool, bool]:
    key = f"tm:club:players:{club_id}:{season_id}"
    path = f"/clubs/{club_id}/players"
    if season_id:
        path += f"?season_id={season_id}"
    return await _cached_get(key, path)

async def get_competition_clubs(comp_id: str, season_id: str | None = None) -> tuple[dict | None, bool, bool]:
    key = f"tm:comp:clubs:{comp_id}:{season_id}"
    path = f"/competitions/{comp_id}/clubs"
    if season_id:
        path += f"?season_id={season_id}"
    return await _cached_get(key, path)

def format_value(value_str: str | int | float | None, currency: str = "EUR") -> dict:
    """Normalize a TM value string to a numeric dict."""
    if value_str is None:
        return {"raw": None, "currency": currency, "display": "N/A", "source_label": "est."}
    if isinstance(value_str, (int, float)):
        raw = float(value_str)
    else:
        # TM returns strings like "€180.00m", "€500Th."
        s = str(value_str).strip()
        raw = None
        try:
            s_clean = s.replace("€", "").replace("£", "").replace("$", "").replace(",", "").strip()
            if "m" in s_clean.lower():
                raw = float(s_clean.lower().replace("m", "")) * 1_000_000
            elif "th" in s_clean.lower() or "k" in s_clean.lower():
                raw = float(re.sub(r"[^0-9.]", "", s_clean)) * 1_000
            else:
                raw = float(re.sub(r"[^0-9.]", "", s_clean))
        except Exception:
            pass

    if raw is None:
        return {"raw": None, "currency": currency, "display": str(value_str), "source_label": "est."}

    if raw >= 1_000_000:
        display = f"€{raw/1_000_000:.1f}m"
    elif raw >= 1_000:
        display = f"€{raw/1_000:.0f}k"
    else:
        display = f"€{raw:.0f}"

    return {"raw": raw, "currency": currency, "display": display, "source_label": "est."}
