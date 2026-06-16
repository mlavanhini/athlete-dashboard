const BASE = '/api'

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  health: () => apiFetch('/health'),

  searchPlayers: (q, page = 1) =>
    apiFetch(`/players/search?q=${encodeURIComponent(q)}&page=${page}`),

  getPlayer: (tmId, sofaId = null) => {
    const qs = sofaId ? `?sofa_id=${sofaId}` : ''
    return apiFetch(`/players/${tmId}${qs}`)
  },

  setEntityOverride: (override) =>
    apiFetch('/players/entity-override', {
      method: 'POST',
      body: JSON.stringify(override),
    }),
}
