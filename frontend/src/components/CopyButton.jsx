import { useState } from 'react'

function buildMarkdown(profile) {
  const id = profile.identity
  const val = profile.valuation
  const stats = profile.stats
  const transfers = profile.transfers || []

  const valueStr = val?.current_value_display || 'N/A'
  const valueNote = val?.stale ? ' *(stale data)*' : ''

  let md = `**${id.name}** (${id.position}, ${id.club}, ${id.nationality?.[0] || ''})\n\n`
  md += `| | |\n|---|---|\n`
  md += `| Market value | ${valueStr} *(est., Transfermarkt)*${valueNote} |\n`
  if (id.contract_expires) md += `| Contract expires | ${id.contract_expires} |\n`
  if (id.age) md += `| Age | ${id.age} |\n`
  if (id.trajectory && id.trajectory !== 'unknown') md += `| Value trend | ${id.trajectory} |\n`

  if (stats?.available) {
    const s = stats
    md += `| Season | ${s.season || 'N/A'} (${s.tournament || ''}) |\n`
    if (s.matches != null) md += `| Apps | ${s.matches} |\n`
    if (s.goals != null) md += `| Goals | ${s.goals} |\n`
    if (s.assists != null) md += `| Assists | ${s.assists} |\n`
    if (s.rating != null) md += `| Rating | ${Number(s.rating).toFixed(1)} *(SofaScore)* |\n`
    if (s.minutes != null) md += `| Minutes | ${s.minutes.toLocaleString()} |\n`
  }

  if (transfers.length > 0) {
    const last = transfers[0]
    md += `\nLast transfer: **${last.from_club} → ${last.to_club}** (${last.season})`
    if (last.fee_display && last.fee_display !== 'N/A') {
      md += `, fee: ${last.fee_display} *(est.)*`
    }
    md += '\n'
  }

  md += `\n*Sources: Transfermarkt (market values — estimated), SofaScore (performance data).*`
  return md
}

export default function CopyButton({ profile }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const text = buildMarkdown(profile)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for environments without clipboard API
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="px-3 py-1.5 text-xs border border-zinc-700 hover:border-zinc-500 rounded transition-colors text-zinc-400 hover:text-zinc-100"
    >
      {copied ? '✓ Copied' : 'Copy for draft'}
    </button>
  )
}
