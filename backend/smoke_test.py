"""
Smoke test: verify data paths from both sources.
Run AFTER starting the Transfermarkt API wrapper on :8000.
Usage: python smoke_test.py
"""
import asyncio
import httpx
import json

TM_BASE = "http://localhost:8000"

async def test_transfermarkt():
    print("\n=== Transfermarkt API Smoke Test ===")
    async with httpx.AsyncClient(base_url=TM_BASE, timeout=15.0) as client:
        try:
            r = await client.get("/players/search/Bellingham")
            r.raise_for_status()
            data = r.json()
            results = data.get("results", [])
            if results:
                print(f"✓ Search: found {len(results)} results for 'Bellingham'")
                player = results[0]
                pid = player.get("id")
                print(f"  First result: {player.get('name')} | ID: {pid} | Value: {player.get('marketValue')}")

                # Profile
                r2 = await client.get(f"/players/{pid}/profile")
                r2.raise_for_status()
                profile = r2.json()
                print(f"✓ Profile: {profile.get('name')} | Club: {profile.get('club', {}).get('name') if isinstance(profile.get('club'), dict) else profile.get('club')}")

                # Market value
                r3 = await client.get(f"/players/{pid}/market_value")
                r3.raise_for_status()
                mv = r3.json()
                history = mv.get("marketValueHistory") or mv.get("market_value_history") or []
                print(f"✓ Market value: {len(history)} history entries | Current: {mv.get('currentMarketValue') or mv.get('marketValue')}")

                return pid
            else:
                print("✗ Search returned no results")
                print("  Raw response:", json.dumps(data, indent=2)[:500])
        except Exception as e:
            print(f"✗ Transfermarkt error: {e}")
            print(f"  Is the wrapper running at {TM_BASE}?")
    return None

async def test_sofascore():
    print("\n=== SofaScore Smoke Test ===")
    try:
        from sofascore_wrapper.api import SofascoreAPI
        from sofascore_wrapper.search import Search

        api = SofascoreAPI()
        search = Search(api, search_string="Bellingham", page=0)
        results = await search.search_players(sport="football")

        if results:
            print(f"✓ Search: found {len(results)} results for 'Bellingham'")
            p = results[0]
            pid = p.get("id")
            print(f"  First result: {p.get('name')} | ID: {pid} | Team: {p.get('team', {}).get('name') if isinstance(p.get('team'), dict) else p.get('team')}")

            # Try stats
            stats = await api._get(f"/api/v1/player/{pid}/statistics/seasons")
            if stats:
                seasons = stats.get("seasons", [])
                print(f"✓ Statistics seasons: {len(seasons)} available")
                if seasons:
                    s = seasons[0]
                    tid = s.get("uniqueTournament", {}).get("id")
                    sid = s.get("id")
                    print(f"  Most recent: {s.get('year')} | {s.get('uniqueTournament', {}).get('name')} | tourney={tid} season={sid}")
            else:
                print("  ⚠ Could not fetch statistics seasons")
        else:
            print("✗ SofaScore search returned no results")

        await api.close()
    except ImportError:
        print("✗ sofascore-wrapper not installed. Run: pip install sofascore-wrapper && python -m playwright install chromium")
    except Exception as e:
        print(f"✗ SofaScore error: {e}")

async def main():
    await test_transfermarkt()
    await test_sofascore()
    print("\n=== Done ===")

if __name__ == "__main__":
    asyncio.run(main())
