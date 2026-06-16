import ValueHistoryChart from './ValueHistoryChart.jsx'
import CopyButton from './CopyButton.jsx'

function TrajectoryIcon({ trajectory }) {
  const map = {
    rising: { icon: '↑', cls: 'trajectory-rising' },
    declining: { icon: '↓', cls: 'trajectory-declining' },
    peaked: { icon: '→', cls: 'trajectory-peaked' },
    unknown: { icon: '?', cls: 'trajectory-unknown' },
  }
  const { icon, cls } = map[trajectory] || map.unknown
  return <span className={cls}>{icon}</span>
}

function StaleBadge({ stale }) {
  if (!stale) return null
  return <span className="badge-stale ml-1">stale</span>
}

function StatBox({ label, value, sub }) {
  return (
    <div className="bg-zinc-800/50 rounded p-3 text-center">
      <div className="text-xl font-bold text-zinc-100">{value ?? '—'}</div>
      <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-zinc-600">{sub}</div>}
    </div>
  )
}

export default function PlayerCard({ profile }) {
  const { identity, valuation, transfers, stats, data_quality } = profile

  return (
    <div className="space-y-4">
      {/* Identity header */}
      <div className="card p-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">{identity.name}</h2>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-sm text-zinc-400">
              <span>{identity.position}</span>
              <span className="text-zinc-600">&middot;</span>
              <span>{identity.club}</span>
              <span className="text-zinc-600">&middot;</span>
              <span>{Array.isArray(identity.nationality) ? identity.nationality.join(', ') : identity.nationality}</span>
              {identity.age && (
                <>
                  <span className="text-zinc-600">&middot;</span>
                  <span>Age {identity.age}</span>
                </>
              )}
            </div>
            {identity.contract_expires && (
              <div className="text-xs text-zinc-500 mt-1">
                Contract until <span className="text-zinc-300">{identity.contract_expires}</span>
              </div>
            )}
          </div>
          <CopyButton profile={profile} />
        </div>

        {/* Source IDs (for debugging matching) */}
        <div className="mt-3 text-xs text-zinc-700 flex gap-3">
          <span title="Transfermarkt ID">TM: {identity.tm_id}</span>
          {identity.sofa_id && <span title="SofaScore ID">Sofa: {identity.sofa_id}</span>}
        </div>
      </div>

      {/* Valuation */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="section-label">Market Value</span>
          <span className="badge-est">est.</span>
          <StaleBadge stale={valuation?.stale} />
          <span className="text-xs text-zinc-600 ml-auto">Transfermarkt</span>
        </div>

        <div className="flex items-baseline gap-3 mb-4">
          <span className="value-big">{valuation?.current_value_display || 'N/A'}</span>
          <TrajectoryIcon trajectory={identity.trajectory} />
          <span className={`text-sm trajectory-${identity.trajectory}`}>{identity.trajectory}</span>
        </div>

        <ValueHistoryChart history={valuation?.history} trajectory={identity.trajectory} />
      </div>

      {/* Stats from SofaScore */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="section-label">Season Performance</span>
          {stats?.available ? (
            <>
              <span className="badge-live">SofaScore</span>
              <StaleBadge stale={stats?.stale} />
              {stats.season && (
                <span className="text-xs text-zinc-500 ml-auto">{stats.season} &middot; {stats.tournament}</span>
              )}
            </>
          ) : (
            <span className="badge-unavail ml-1">unavailable</span>
          )}
        </div>

        {stats?.available ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatBox label="Appearances" value={stats.matches} />
            <StatBox label="Goals" value={stats.goals} />
            <StatBox label="Assists" value={stats.assists} />
            <StatBox
              label="Rating"
              value={stats.rating != null ? Number(stats.rating).toFixed(1) : null}
              sub="avg"
            />
            {stats.minutes != null && (
              <StatBox label="Minutes" value={stats.minutes?.toLocaleString()} />
            )}
            {stats.yellow_cards != null && (
              <StatBox label="Yellows" value={stats.yellow_cards} />
            )}
          </div>
        ) : (
          <p className="text-zinc-600 text-xs">
            SofaScore data not available.
            {!data_quality?.sofa_available
              ? ' Install sofascore-wrapper and Playwright to enable: pip install sofascore-wrapper && python -m playwright install chromium'
              : ' Player could not be matched.'}
          </p>
        )}
      </div>

      {/* Transfer history */}
      <div className="card overflow-hidden">
        <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
          <span className="section-label">Transfer History</span>
          <span className="text-xs text-zinc-600">Transfermarkt &middot; est.</span>
        </div>

        {transfers.length === 0 ? (
          <div className="px-4 py-4 text-zinc-600 text-xs">No transfer history available</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 text-left">
                <th className="px-4 py-2 text-xs text-zinc-500 font-medium">Season</th>
                <th className="px-4 py-2 text-xs text-zinc-500 font-medium">From</th>
                <th className="px-4 py-2 text-xs text-zinc-500 font-medium">To</th>
                <th className="px-4 py-2 text-xs text-zinc-500 font-medium text-right">Fee (est.)</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((tr, i) => (
                <tr key={i} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30">
                  <td className="px-4 py-2 text-zinc-400 text-xs">{tr.season || tr.date}</td>
                  <td className="px-4 py-2 text-zinc-300 text-xs">{tr.from_club}</td>
                  <td className="px-4 py-2 text-zinc-300 text-xs">{tr.to_club}</td>
                  <td className="px-4 py-2 text-right font-mono text-xs">
                    {tr.fee_display && tr.fee_display !== 'N/A'
                      ? <span className="text-zinc-100">{tr.fee_display}</span>
                      : <span className="text-zinc-600">{tr.type || 'N/A'}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
