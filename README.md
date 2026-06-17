# Soccer Finance & Strategy Dashboard

A local research tool for writing about soccer finance, strategy, and transfers. Pulls from Transfermarkt (valuations), SofaScore (performance), Capology (wages — Phase 2), and your own audited revenue CSV (Phase 3).

## Architecture

```
frontend (React+Vite :5173)
    ↕ /api proxy
backend (FastAPI :8001)  ← SQLite cache (backend/cache.db)
    ↕                ↕
TM wrapper (:8000)   SofaScore (Playwright/Chromium)
```

## Quick start

### 1. Transfermarkt API wrapper (required)

The Transfermarkt wrapper is a separate FastAPI service you run locally. It scrapes Transfermarkt for valuations, transfers, and squad data.

```bash
git clone https://github.com/felipeall/transfermarkt-api.git
cd transfermarkt-api
pip3 install poetry
poetry install --no-root
python3 app/main.py
# Runs on http://localhost:8000  — leave this terminal open
```

> **macOS note:** use `pip3` and `python3`. If those aren't found either, install Python via `brew install python`.

Or with Docker:
```bash
cd transfermarkt-api
docker build -t tm-api .
docker run -d -p 8000:8000 tm-api
```

Verify it's up: `curl http://localhost:8000/players/search/Bellingham`

### 2. Backend

```bash
cd backend
pip3 install -r requirements.txt
python3 -m playwright install chromium   # for SofaScore support (optional but recommended)
python3 main.py
# Runs on http://localhost:8001
```

SofaScore requires Chromium via Playwright. If you skip the Playwright install, the backend still works — all player cards show TM data only, with a "SofaScore offline" badge.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

### All-in-one convenience script

```bash
./start.sh
```

### Smoke test (verify data paths before using the UI)

With the TM wrapper running on :8000:
```bash
cd backend
python3 smoke_test.py
```

This hits one endpoint from each live source and prints formatted results.

---

## Data sources

| Source | What it provides | Data type | Label in UI |
|--------|-----------------|-----------|-------------|
| Transfermarkt | Market values, transfer fees, contracts, squad data | Editorial estimates | `est.` |
| SofaScore | Match ratings, goals/assists, minutes, fixtures | Live/scraped data | `SofaScore` |
| Capology | Estimated weekly wages, club payrolls | Estimated gross | `est.` (Phase 2) |
| Revenue CSV | Deloitte Money League + UEFA + club accounts | Audited/published | `audited` (Phase 3) |

**Important:** Transfermarkt values and Capology wages are estimates, not verified figures. Always label them as estimated in your articles. The revenue CSV is the only audited source.

---

## Wrapper → endpoint mapping

### Transfermarkt API (felipeall/transfermarkt-api)

| Backend function | Wrapper endpoint |
|-----------------|-----------------|
| `search_players(name)` | `GET /players/search/{name}` |
| `get_player_profile(id)` | `GET /players/{id}/profile` |
| `get_player_market_value(id)` | `GET /players/{id}/market_value` |
| `get_player_transfers(id)` | `GET /players/{id}/transfers` |
| `get_player_stats(id)` | `GET /players/{id}/stats` |
| `search_clubs(name)` | `GET /clubs/search/{name}` |
| `get_club_players(id)` | `GET /clubs/{id}/players` |
| `get_competition_clubs(id)` | `GET /competitions/{id}/clubs` |

All TM IDs are Transfermarkt's own numeric IDs (visible in Transfermarkt URLs).

### SofaScore (sofascore-wrapper Python package)

| Backend function | Library call |
|-----------------|-------------|
| `search_players(name)` | `Search(api, name).search_players(sport="football")` |
| `get_player_statistics(sofa_id)` | `api._get("/api/v1/player/{id}/statistics/seasons")` then season stats endpoint |
| `get_player_id_by_name(tm_name)` | search + name matching |

SofaScore IDs are numeric and differ from Transfermarkt IDs. They're resolved via name matching on first lookup.

---

## Cross-source entity matching

There is no shared ID across sources. Matching works as follows:

1. **Manual override** (highest priority): checked first against `data/entity_mapping.json`
2. **Exact normalized match**: lowercase + strip accents + remove punctuation
3. **Fuzzy token match**: all tokens of the shorter name appear in the longer one
4. **Unmatched**: player card shows TM data only, SofaScore shows "unavailable"

### Fixing a bad match

The search results table shows a `match` confidence badge (`exact`, `fuzzy`, `manual`, `no match`) and the raw source name on hover. If a match is wrong, set a manual override:

```bash
curl -X POST http://localhost:8001/api/players/entity-override \
  -H "Content-Type: application/json" \
  -d '{"tm_id": "581678", "sofa_id": "934235", "canonical_name": "Jude Bellingham", "aliases": ["J. Bellingham"]}'
```

Or edit `data/entity_mapping.json` directly:

```json
{
  "players": {
    "Jude Bellingham": {
      "tm_id": "581678",
      "sofa_id": "934235",
      "aliases": ["J. Bellingham"]
    }
  },
  "clubs": {
    "Real Madrid": {
      "tm_id": "418",
      "sofa_id": "2829",
      "aliases": ["Real Madrid CF"]
    }
  }
}
```

The mapping file is at `data/entity_mapping.json`. Edit it with any text editor; changes take effect on the next request (no restart needed).

---

## Caching

All external responses are cached in SQLite (`backend/cache.db`).

| Data type | Default TTL |
|-----------|-------------|
| Player profiles, valuations | 24h |
| Search results | 1h |
| Fixtures | 1h |

When a source is down, the backend returns cached data and adds a `stale: true` flag — the UI shows a `stale` badge rather than erroring out.

To clear the cache: `rm backend/cache.db` (it will be recreated on next start).

---

## Revenue CSV (Phase 3 — audited data)

Drop a CSV into `data/` with this schema:

```
club,season,revenue,matchday,broadcast,commercial,wage_bill,source_url
"Manchester City",2025,714000000,85000000,329000000,300000000,398000000,https://...
```

All figures in EUR. `source_url` should link to the published report (Deloitte, UEFA, club accounts).

This is the only audited data source. The UI tags it `audited` and the "copy for draft" output uses that label.

---

## Source quirks

- **Transfermarkt values**: expressed in strings like `€180.00m` or `€500Th.`. The backend normalizes these to raw floats. Values are editorial estimates by Transfermarkt editors, not verified transfer fees.
- **SofaScore statistics endpoint**: the season stats path requires finding the `uniqueTournament.id` and `season.id` from the `/statistics/seasons` endpoint first. The service falls back to an alternate endpoint if the primary fails.
- **SofaScore 403s**: the sofascore-wrapper uses Playwright/Chromium to bypass Sofascore's 403 blocks on direct HTTP requests. This is slower than direct API calls (~2-5s per request). Results are cached aggressively to compensate.
- **Capology** (Phase 2): JS-rendered, needs Selenium. Only public payroll tables and top-earner lists are scraped — individual contract details are paywalled and not accessed.
- **Rate limiting**: 1 req/sec per source enforced in the backend. Don't remove this.

---

## Phase roadmap

- **Phase 1** ✅ Player search → combined card (market value + value history + SofaScore stats)
- **Phase 2** — Capology wages integration + wages-vs-value-vs-output view
- **Phase 3** — Manual revenue CSV loader + club efficiency ratios + provenance labels
