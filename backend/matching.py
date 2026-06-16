import json
import os
import re
import logging
from unidecode import unidecode
from config import settings

logger = logging.getLogger(__name__)

# In-memory cache of the mapping file
_mapping: dict = {}

def _load_mapping() -> dict:
    global _mapping
    try:
        if os.path.exists(settings.mapping_file):
            with open(settings.mapping_file, "r") as f:
                _mapping = json.load(f)
        else:
            _mapping = {"players": {}, "clubs": {}}
            _save_mapping()
    except Exception as e:
        logger.warning(f"Could not load entity mapping: {e}")
        _mapping = {"players": {}, "clubs": {}}
    return _mapping

def _save_mapping():
    try:
        os.makedirs(os.path.dirname(settings.mapping_file), exist_ok=True)
        with open(settings.mapping_file, "w") as f:
            json.dump(_mapping, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Could not save entity mapping: {e}")

def normalize_name(name: str) -> str:
    """Lowercase, strip accents, remove punctuation, collapse whitespace."""
    if not name:
        return ""
    n = unidecode(name).lower()
    n = re.sub(r"[^\w\s]", " ", n)
    n = re.sub(r"\s+", " ", n).strip()
    return n

def _name_variants(name: str) -> list[str]:
    """Generate plausible variants: full name, abbreviated first name."""
    parts = name.split()
    variants = [normalize_name(name)]
    if len(parts) >= 2:
        # "J. Silva" form
        variants.append(normalize_name(f"{parts[0][0]}. {' '.join(parts[1:])}"))
        # surname only
        variants.append(normalize_name(parts[-1]))
    return variants

def find_sofa_match(tm_name: str, sofa_results: list[dict]) -> tuple[dict | None, str]:
    """
    Try to match a Transfermarkt player name against a list of SofaScore search results.
    Returns (best_match_dict, confidence: 'exact'|'fuzzy'|'unmatched').
    """
    mapping = _load_mapping()

    # Check manual override first
    norm = normalize_name(tm_name)
    for canonical, entry in mapping.get("players", {}).items():
        if normalize_name(canonical) == norm or norm in [normalize_name(a) for a in entry.get("aliases", [])]:
            sofa_id = entry.get("sofa_id")
            if sofa_id:
                for r in sofa_results:
                    if str(r.get("id")) == str(sofa_id):
                        return r, "manual"

    tm_variants = _name_variants(tm_name)

    # Exact normalized match
    for result in sofa_results:
        sofa_name = result.get("name", result.get("shortName", ""))
        sofa_variants = _name_variants(sofa_name)
        if any(tv == sv for tv in tm_variants for sv in sofa_variants):
            return result, "exact"

    # Fuzzy: check if all tokens of the shorter name appear in the longer one
    for result in sofa_results:
        sofa_name = result.get("name", result.get("shortName", ""))
        norm_sofa = normalize_name(sofa_name)
        norm_tm = normalize_name(tm_name)
        tokens_tm = set(norm_tm.split())
        tokens_sofa = set(norm_sofa.split())
        if len(tokens_tm) >= 2 and tokens_tm.issubset(tokens_sofa):
            return result, "fuzzy"
        if len(tokens_sofa) >= 2 and tokens_sofa.issubset(tokens_tm):
            return result, "fuzzy"

    return None, "unmatched"

def find_club_match(tm_name: str, sofa_results: list[dict]) -> tuple[dict | None, str]:
    """Same logic but for clubs."""
    mapping = _load_mapping()
    norm = normalize_name(tm_name)
    for canonical, entry in mapping.get("clubs", {}).items():
        if normalize_name(canonical) == norm or norm in [normalize_name(a) for a in entry.get("aliases", [])]:
            sofa_id = entry.get("sofa_id")
            if sofa_id:
                for r in sofa_results:
                    if str(r.get("id")) == str(sofa_id):
                        return r, "manual"

    for result in sofa_results:
        sofa_name = result.get("name", result.get("shortName", ""))
        if normalize_name(sofa_name) == norm:
            return result, "exact"

    for result in sofa_results:
        sofa_name = result.get("name", result.get("shortName", ""))
        norm_sofa = normalize_name(sofa_name)
        tokens_tm = set(norm.split())
        tokens_sofa = set(norm_sofa.split())
        if tokens_tm and tokens_tm.issubset(tokens_sofa):
            return result, "fuzzy"
        if tokens_sofa and tokens_sofa.issubset(tokens_tm):
            return result, "fuzzy"

    return None, "unmatched"

def set_player_override(tm_id: str, sofa_id: str, canonical_name: str, aliases: list[str] = None):
    mapping = _load_mapping()
    if "players" not in mapping:
        mapping["players"] = {}
    mapping["players"][canonical_name] = {
        "tm_id": tm_id,
        "sofa_id": sofa_id,
        "aliases": aliases or []
    }
    _save_mapping()

def set_club_override(tm_id: str, sofa_id: str, canonical_name: str, aliases: list[str] = None):
    mapping = _load_mapping()
    if "clubs" not in mapping:
        mapping["clubs"] = {}
    mapping["clubs"][canonical_name] = {
        "tm_id": tm_id,
        "sofa_id": sofa_id,
        "aliases": aliases or []
    }
    _save_mapping()

def get_mapping() -> dict:
    return _load_mapping()
