import asyncio
import logging
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import services.transfermarkt as tm
import services.sofascore as sofa
from matching import set_player_override, get_mapping, find_sofa_match

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/players", tags=["players"])

class EntityOverride(BaseModel):
    tm_id: str
    sofa_id: str
    canonical_name: str
    aliases: list[str] = []

def _detect_trajectory(history: list[dict]) -> str:
    """Detect value trajectory from market value history."""
    if not history or len(history) < 2:
        return "unknown"
    try:
        values = [float(h.get("value", 0) or 0) for h in history[-6:]]
        values = [v for v in values if v > 0]
        if len(values) < 2:
            return "unknown"
        recent = sum(values[-2:]) / 2
        older = sum(values[:2]) / 2
        pct_change = (recent - older) / older if older > 0 else 0
        if pct_change > 0.15:
            return "rising"
        elif pct_change < -0.15:
            return "declining"
        elif pct_change < -0.05:
            return "peaked"
        return "peaked"
    except Exception:
        return "unknown"

@router.get("/search")
async def search_players(
    q: str = Query(..., min_length=2),
    page: int = Query(1, ge=1)
):
    """Search players across Transfermarkt (and attempt SofaScore matching)."""
    tm_results, tm_cached, tm_stale = await tm.search_players(q, page)
    sofa_avail = await sofa.is_available()
    sofa_raw, sofa_cached, sofa_stale = await sofa.search_players(q) if sofa_avail else ([], False, False)

    results = []
    for p in tm_results:
        raw_name = p.get("name", "")
        mv_dict = tm.format_value(p.get("marketValue") or p.get("market_value"))

        sofa_match, confidence = find_sofa_match(raw_name, sofa_raw) if sofa_raw else (None, "unmatched")

        results.append({
            "tm_id": str(p.get("id", "")),
            "sofa_id": str(sofa_match.get("id")) if sofa_match else None,
            "name": raw_name,
            "raw_tm_name": raw_name,
            "raw_sofa_name": sofa_match.get("name") if sofa_match else None,
            "club": p.get("club", {}).get("name", "") if isinstance(p.get("club"), dict) else p.get("club", ""),
            "position": p.get("position", ""),
            "nationality": p.get("nationality", ""),
            "age": p.get("age"),
            "market_value": mv_dict["raw"],
            "market_value_display": mv_dict["display"],
            "market_value_currency": mv_dict["currency"],
            "match_confidence": confidence,
            "sofa_available": sofa_avail,
        })

    return {
        "results": results,
        "query": q,
        "page": page,
        "data_quality": {
            "tm_cached": tm_cached,
            "tm_stale": tm_stale,
            "sofa_available": sofa_avail,
            "sofa_cached": sofa_cached,
        }
    }

@router.get("/entity-mapping")
async def get_entity_mapping():
    """Get the current entity mapping table."""
    return get_mapping()

@router.get("/{tm_id}")
async def get_player(
    tm_id: str,
    sofa_id: str = Query(None)
):
    """Get combined player profile: TM valuation + SofaScore stats."""
    profile_task = tm.get_player_profile(tm_id)
    mv_task = tm.get_player_market_value(tm_id)
    transfers_task = tm.get_player_transfers(tm_id)

    (profile, p_cached, p_stale), (mv, mv_cached, mv_stale), (transfers, t_cached, t_stale) = await asyncio.gather(
        profile_task, mv_task, transfers_task
    )

    if not profile:
        raise HTTPException(404, f"Player {tm_id} not found on Transfermarkt")

    # Parse market value history
    mv_history = []
    trajectory = "unknown"
    current_value_dict = {"raw": None, "display": "N/A", "currency": "EUR", "source_label": "est."}

    if mv:
        history_raw = mv.get("marketValueHistory") or mv.get("market_value_history") or []
        for h in history_raw:
            val = tm.format_value(h.get("value") or h.get("marketValue"))
            mv_history.append({
                "date": h.get("date", ""),
                "value": val["raw"],
                "value_display": val["display"],
                "club": h.get("clubName") or h.get("club", {}).get("name", "") if isinstance(h.get("club"), dict) else h.get("club", ""),
            })
        trajectory = _detect_trajectory(mv_history)

        current_raw = mv.get("currentMarketValue") or mv.get("marketValue") or (mv_history[-1]["value"] if mv_history else None)
        current_value_dict = tm.format_value(current_raw)

    # Parse transfers
    transfer_list = []
    if transfers:
        raw_transfers = transfers.get("transfers", [])
        for tr in raw_transfers:
            fee_dict = tm.format_value(tr.get("fee") or tr.get("transferFee"))
            transfer_list.append({
                "season": tr.get("season", ""),
                "date": tr.get("date", ""),
                "from_club": tr.get("from", {}).get("name", "") if isinstance(tr.get("from"), dict) else tr.get("fromClub", ""),
                "to_club": tr.get("to", {}).get("name", "") if isinstance(tr.get("to"), dict) else tr.get("toClub", ""),
                "fee": fee_dict["raw"],
                "fee_display": fee_dict["display"],
                "fee_currency": fee_dict["currency"],
                "type": tr.get("type", tr.get("contractExtension", "")),
            })

    # SofaScore stats
    sofa_stats_data = None
    sofa_cached_flag = False
    sofa_stale_flag = False
    sofa_avail = await sofa.is_available()

    if sofa_avail and not sofa_id:
        # Try to find sofa_id by name
        player_name = profile.get("name", "")
        sofa_id, _ = await sofa.get_player_id_by_name(player_name)

    if sofa_id:
        sofa_stats_data, sofa_cached_flag, sofa_stale_flag = await sofa.get_player_statistics(sofa_id)

    # Build response
    return {
        "identity": {
            "tm_id": tm_id,
            "sofa_id": sofa_id,
            "name": profile.get("name", ""),
            "full_name": profile.get("fullName") or profile.get("name", ""),
            "age": profile.get("age"),
            "date_of_birth": profile.get("dateOfBirth") or profile.get("birthDate"),
            "nationality": profile.get("nationality", []) if isinstance(profile.get("nationality"), list) else [profile.get("nationality", "")],
            "position": profile.get("position", ""),
            "club": profile.get("club", {}).get("name", "") if isinstance(profile.get("club"), dict) else profile.get("currentClub", ""),
            "contract_expires": profile.get("contractExpiry") or profile.get("contract", {}).get("expiry") if isinstance(profile.get("contract"), dict) else None,
            "trajectory": trajectory,
        },
        "valuation": {
            "current_value": current_value_dict["raw"],
            "current_value_display": current_value_dict["display"],
            "currency": current_value_dict["currency"],
            "source": "transfermarkt",
            "source_label": "est.",
            "history": mv_history,
            "cached": mv_cached,
            "stale": mv_stale,
        },
        "transfers": transfer_list,
        "stats": {
            "available": sofa_stats_data is not None,
            "source": "sofascore" if sofa_stats_data else None,
            "source_label": "live data" if sofa_stats_data else None,
            **(sofa_stats_data or {}),
            "cached": sofa_cached_flag,
            "stale": sofa_stale_flag,
        },
        "data_quality": {
            "tm_profile_cached": p_cached,
            "tm_profile_stale": p_stale,
            "tm_mv_cached": mv_cached,
            "tm_mv_stale": mv_stale,
            "sofa_available": sofa_avail,
        }
    }

@router.post("/entity-override")
async def set_entity_override(override: EntityOverride):
    """Manually set the TM<->SofaScore ID mapping for a player."""
    set_player_override(override.tm_id, override.sofa_id, override.canonical_name, override.aliases)
    return {"status": "ok", "message": f"Override set for {override.canonical_name}"}
