import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'

function formatMillions(v) {
  if (v == null) return 'N/A'
  if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(0)}m`
  if (v >= 1_000) return `€${(v / 1_000).toFixed(0)}k`
  return `€${v}`
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded p-2 text-xs">
      <div className="text-zinc-400">{label}</div>
      <div className="text-zinc-100 font-bold">{formatMillions(d.value)}</div>
      {d.payload?.club && <div className="text-zinc-500">{d.payload.club}</div>}
    </div>
  )
}

export default function ValueHistoryChart({ history, trajectory }) {
  if (!history || history.length === 0) {
    return <div className="text-zinc-600 text-xs py-4 text-center">No value history available</div>
  }

  const data = history.map(h => ({
    date: h.date ? h.date.substring(0, 7) : '',
    value: h.value,
    club: h.club,
  }))

  const strokeColor = trajectory === 'rising' ? '#34d399' : trajectory === 'declining' ? '#f87171' : '#a78bfa'

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
            <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tick={{ fill: '#52525b', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={formatMillions}
          tick={{ fill: '#52525b', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={strokeColor}
          strokeWidth={2}
          fill="url(#valueGrad)"
          dot={false}
          activeDot={{ r: 4, fill: strokeColor }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
