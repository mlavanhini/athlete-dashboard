import { useState, useCallback } from 'react'
import { api } from '../api/client.js'

function ConfidenceBadge({ confidence }) {
  const map = {
    exact: { label: 'exact', cls: 'text-emerald-400' },
    fuzzy: { label: 'fuzzy', cls: 'text-amber-400' },
    manual: { label: 'manual', cls: 'text-blue-400' },
    unmatched: { label: 'no match', cls: 'text-zinc-600' },
  }
  const { label, cls } = map[confidence] || map.unmatched
  return <span className={`text-xs ${cls}`}>{label}</span>
}

export default function PlayerSearch({ onSelectPlayer }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [dataQuality, setDataQuality] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)

  const handleSearch = useCallback(async (e) => {
    e.preventDefault()
    if (query.trim().length < 2) return
    setLoading(true)
    setError(null)
    setSearched(true)
    try {
      const data = await api.searchPlayers(query.trim())
      setResults(data.results || [])
      setDataQuality(data.data_quality)
    } catch (err) {
      setError(err.message)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [query])

  return (
    <div className="space-y-4">
      {/* Search box */}
      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search player name&hellip; (e.g. Bellingham, Vinicius, Pedri)"
            className="flex-1 bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
          />
          <button
            type="submit"
            disabled={loading || query.trim().length < 2}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:text-zinc-600 rounded text-sm transition-colors"
          >
            {loading ? '&hellip;' : 'Search'}
          </button>
        </form>

        {dataQuality && (
          <div className="mt-2 flex gap-3 text-xs text-zinc-600">
            {dataQuality.tm_stale && <span className="badge-stale">TM stale</span>}
            {!dataQuality.sofa_available && <span className="badge-unavail">SofaScore offline</span>}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="card p-3 border-red-800 bg-red-950/20 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Results table */}
      {searched && !loading && results.length === 0 && !error && (
        <div className="card p-6 text-center text-zinc-500">No players found for &ldquo;{query}&rdquo;</div>
      )}

      {results.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
            <span className="section-label">Results</span>
            <span className="text-xs text-zinc-500">{results.length} players</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-zinc-800">
                <th className="px-4 py-2 text-xs text-zinc-500 font-medium">Player</th>
                <th className="px-4 py-2 text-xs text-zinc-500 font-medium">Club</th>
                <th className="px-4 py-2 text-xs text-zinc-500 font-medium">Pos</th>
                <th className="px-4 py-2 text-xs text-zinc-500 font-medium">Age</th>
                <th className="px-4 py-2 text-xs text-zinc-500 font-medium text-right">Value (est.)</th>
                <th className="px-4 py-2 text-xs text-zinc-500 font-medium text-center">Match</th>
              </tr>
            </thead>
            <tbody>
              {results.map((p) => (
                <tr
                  key={p.tm_id}
                  className="table-row-hover border-b border-zinc-800/50 last:border-0"
                  onClick={() => onSelectPlayer(p)}
                >
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-zinc-100">{p.name}</div>
                    <div className="text-xs text-zinc-500">{p.nationality}</div>
                  </td>
                  <td className="px-4 py-2.5 text-zinc-300">{p.club}</td>
                  <td className="px-4 py-2.5 text-zinc-400 text-xs">{p.position}</td>
                  <td className="px-4 py-2.5 text-zinc-400">{p.age}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="text-zinc-100 font-mono">{p.market_value_display}</span>
                    {' '}
                    <span className="badge-est">est.</span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <ConfidenceBadge confidence={p.match_confidence} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Instructions when empty */}
      {!searched && (
        <div className="card p-6 text-zinc-600 text-xs space-y-1">
          <p className="text-zinc-400 font-medium mb-2">Phase 1 &mdash; Player Lookup</p>
          <p>Search any player across all major leagues. Results pull from Transfermarkt (market values, contracts) and SofaScore (performance ratings).</p>
          <p className="mt-2">Data marked <span className="badge-est">est.</span> = estimated by source, not audited.</p>
        </div>
      )}
    </div>
  )
}
