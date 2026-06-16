import asyncio
import logging
import time
from cache import get_cached, set_cached
from config import settings
from matching import find_sofa_match

logger = logging.getLogger(__name__)

_api = None
_last_request_time: float = 0.0
_available: bool | None = None  # None = untested

async def _get_api():
    global _api, _available
    if _available is False:
        return None
    if _api is not None:
        return _api
    try:
        from sofascore_wrapper.api import SofascoreAPI
        api = SofascoreAPI()
        _api = api
        _available = True
        logger.info("SofaScore: Playwright browser initialized")
        return _api
    except Exception as e:
        logger.warning(f"SofaScore unavailable (Playwright not ready?): {e}")
        _available = False
        return None

async def close():
    global _api, _available
    if _api is not None:
        try:
            await _api.close()
        except Exception:
            pass
        _api = None
    _available = None

async def _throttled_get(endpoint: str) -> dict | None:
    global _last_request_time
    api = await _get_api()
    if api is None:
        return None

    now = time.time()
    wait = settings.rate_limit_delay - (now - _last_request_time)
    if wait > 0:
        await asyncio.sleep(wait)

    try:
        data = await api._get(endpoint)
        _last_request_time = time.time()
        return data
    except Exception as e:
        logger.warning(f"SofaScore _get error for {endpoint}: {e}")
        return None

async def is_available() -> bool:
    api = await _get_api()
    return api is not None

async def search_players(name: str) -> tuple[list[dict], bool, bool]:
    """Search for players on SofaScore. Returns (results, from_cache, is_stale)."""
    key = f"sofa:search:player:{name}"
    cached_data, is_stale = await get_cached(key)
    if cached_data is not None and not is_stale:
        return cached_data, True, False

    api = await _get_api()
    if api is None:
        return cached_data or [], bool(cached_data), bool(is_stale)

    try:
        from sofascore_wrapper.search import Search
        search = Search(api, search_string=name, page=0)
        results = await search.search_players(sport="football")
        # Normalize results
        normalized = []
        for r in (results or []):
            normalized.append({
                "id": str(r.get("id", "")),
                "name": r.get("name", r.get("shortName", "")),
                "shortName": r.get("shortName", ""),
                "position": r.get("position", {}).get("name", "") if isinstance(r.get("position"), dict) else r.get("position", ""),
                "team": r.get("team", {}).get("name", "") if isinstance(r.get("team"), dict) else "",
                "nationality": r.get("country", {}).get("name", "") if isinstance(r.get("country"), dict) else "",
                "slug": r.get("slug", ""),
            })
        await set_cached(key, normalized, ttl=3600)
        return normalized, False, False
    except Exception as e:
        logger.warning(f"SofaScore search error: {e}")
        return cached_data or [], bool(cached_data), True

async def get_player_statistics(sofa_id: str) -> tuple[dict | None, bool, bool]:
    """Get player season stats from SofaScore."""
    key = f"sofa:player:stats:{sofa_id}"
    cached_data, is_stale = await get_cached(key)
    if cached_data is not None and not is_stale:
        return cached_data, True, False

    api = await _get_api()
    if api is None:
        return cached_data, bool(cached_data), bool(is_stale and cached_data)

    try:
        # Get available seasons first
        seasons_data = await _throttled_get(f"/api/v1/player/{sofa_id}/statistics/seasons")
        if not seasons_data:
            return cached_data, bool(cached_data), True

        seasons = seasons_data.get("seasons", [])
        # Find most recent football season
        football_seasons = [s for s in seasons if s.get("uniqueTournament", {}).get("category", {}).get("sport", {}).get("slug") == "football" or True]
        if not football_seasons:
            return cached_data, bool(cached_data), True

        # Use first (most recent) season
        season = football_seasons[0]
        tournament_id = season.get("uniqueTournament", {}).get("id")
        season_id = season.get("id")
        season_name = season.get("year", "")
        tournament_name = season.get("uniqueTournament", {}).get("name", "")

        if not tournament_id or not season_id:
            return cached_data, bool(cached_data), True

        stats_data = await _throttled_get(f"/api/v1/player/{sofa_id}/statistics/season/{season_id}/unique-tournament/{tournament_id}/accumulation/total")
        if not stats_data:
            # Try alternate endpoint
            stats_data = await _throttled_get(f"/api/v1/player/{sofa_id}/statistics/{season_id}/unique-tournament/{tournament_id}")

        if not stats_data:
            return cached_data, bool(cached_data), True

        stats = stats_data.get("statistics", stats_data.get("data", {}))

        result = {
            "season": season_name or f"Season {season_id}",
            "tournament": tournament_name,
            "matches": stats.get("appearances", stats.get("matchesPlayed", None)),
            "goals": stats.get("goals", None),
            "assists": stats.get("assists", None),
            "rating": stats.get("rating", None),
            "minutes": stats.get("minutesPlayed", None),
            "yellow_cards": stats.get("yellowCards", None),
            "red_cards": stats.get("redCards", None),
        }

        await set_cached(key, result, ttl=settings.cache_ttl_default)
        return result, False, False
    except Exception as e:
        logger.warning(f"SofaScore stats error for {sofa_id}: {e}")
        return cached_data, bool(cached_data), True

async def get_player_id_by_name(tm_name: str) -> tuple[str | None, str]:
    """Find SofaScore player ID matching a Transfermarkt player name. Returns (sofa_id, confidence)."""
    sofa_results, _, _ = await search_players(tm_name)
    if not sofa_results:
        return None, "unmatched"
    match, confidence = find_sofa_match(tm_name, sofa_results)
    if match:
        return str(match.get("id")), confidence
    return None, "unmatched"
