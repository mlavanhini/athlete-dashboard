import { useState, useEffect } from 'react'
import PlayerSearch from './components/PlayerSearch.jsx'
import PlayerCard from './components/PlayerCard.jsx'
import { api } from './api/client.js'

function SourceStatus({ sources }) {
  if (!sources) return null
  return (
    <div className="flex gap-3 text-xs text-zinc-500">
      <span>
        TM:{' '}
        <span className={sources.transfermarkt?.status === 'configured' ? 'text-emerald-400' : 'text-red-400'}>
          {sources.transfermarkt?.status || '?'}
        </span>
      </span>
      <span>
        SofaScore:{' '}
        <span className={sources.sofascore?.status === 'available' ? 'text-emerald-400' : 'text-amber-400'}>
          {sources.sofascore?.status || '?'}
        </span>
      </span>
    </div>
  )
}

export default function App() {
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [playerProfile, setPlayerProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [health, setHealth] = useState(null)

  useEffect(() => {
    api.health().then(setHealth).catch(() => setHealth({ status: 'error', sources: {} }))
  }, [])

  async function handleSelectPlayer(player) {
    setSelectedPlayer(player)
    setPlayerProfile(null)
    setError(null)
    setLoading(true)
    try {
      const profile = await api.getPlayer(player.tm_id, player.sofa_id)
      setPlayerProfile(profile)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleBack() {
    setSelectedPlayer(null)
    setPlayerProfile(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedPlayer && (
              <button
                onClick={handleBack}
                className="text-zinc-400 hover:text-zinc-100 text-xs border border-zinc-700 rounded px-2 py-1 transition-colors"
              >
                &larr; Back
              </button>
            )}
            <h1 className="text-sm font-bold tracking-tight text-zinc-100">
              Soccer Finance &amp; Strategy
            </h1>
          </div>
          <SourceStatus sources={health?.sources} />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {!selectedPlayer ? (
          <PlayerSearch onSelectPlayer={handleSelectPlayer} />
        ) : (
          <div>
            {loading && (
              <div className="card p-6 text-center text-zinc-400">
                Loading {selectedPlayer.name}&hellip;
              </div>
            )}
            {error && (
              <div className="card p-4 border-red-800 bg-red-950/20 text-red-400">
                Error: {error}
              </div>
            )}
            {playerProfile && !loading && (
              <PlayerCard profile={playerProfile} />
            )}
          </div>
        )}
      </main>
    </div>
  )
}
