function getGreeting() {
  const hour = new Date().getUTCHours() - 5 // America/New_York offset (approximate)
  const adj = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  return `Good ${adj}`
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/New_York',
  })
}

export default function HubPage() {
  const now = new Date()

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <p className="text-text-muted text-sm mb-1">{formatDate(now)}</p>
        <h1 className="text-3xl font-semibold text-text-primary">
          {getGreeting()} — your cockpit is ready.
        </h1>
      </div>

      {/* Top panels */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* Today's Actions */}
        <div className="bg-panel border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">Today&apos;s Actions</h2>
            <span className="text-xs text-text-muted bg-panel-hover px-2 py-0.5 rounded-full">Phase 2</span>
          </div>
          <div className="space-y-2">
            {['Review Q2 variance analysis', 'Strength training', 'Meditation practice'].map((t) => (
              <div key={t} className="flex items-center gap-3 py-1">
                <div className="w-4 h-4 rounded border border-border flex-shrink-0" />
                <span className="text-sm text-text-muted">{t}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-text-muted italic">Tasks module coming in Phase 2</p>
        </div>

        {/* Today's Calendar */}
        <div className="bg-panel border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">Today&apos;s Calendar</h2>
            <span className="text-xs text-text-muted bg-panel-hover px-2 py-0.5 rounded-full">Phase 4</span>
          </div>
          <div className="space-y-2">
            {[
              { time: '9:00 AM', title: 'CFO Sync — Sarah Chen', color: 'bg-blue-500' },
              { time: '11:00 AM', title: 'Budget Review', color: 'bg-purple-500' },
              { time: '3:00 PM', title: 'Run: 8 miles', color: 'bg-accent' },
            ].map((e) => (
              <div key={e.title} className="flex items-center gap-3 py-1">
                <div className={`w-1 h-8 rounded-full ${e.color} flex-shrink-0`} />
                <div>
                  <p className="text-xs text-text-muted">{e.time}</p>
                  <p className="text-sm text-text-primary">{e.title}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-text-muted italic">Google Calendar sync coming in Phase 4</p>
        </div>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Projects', count: 7, href: '/entities/projects', icon: '◈' },
          { label: 'Key Elements', count: 6, href: '/entities/key-elements', icon: '◆' },
          { label: 'Topics', count: 6, href: '/entities/topics', icon: '◇' },
          { label: 'Goals', count: 6, href: '/entities/goals', icon: '◎' },
          { label: 'Habits', count: 7, href: '/entities/habits', icon: '↻' },
          { label: 'People', count: 8, href: '/entities/people', icon: '◎' },
        ].map((card) => (
          <a
            key={card.label}
            href={card.href}
            className="bg-panel border border-border rounded-xl p-5 hover:border-accent/40 hover:bg-panel-hover transition-colors group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xl">{card.icon}</span>
              <span className="text-2xl font-bold text-accent">{card.count}</span>
            </div>
            <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">
              {card.label}
            </p>
          </a>
        ))}
      </div>

      {/* Fleeting parking lot */}
      <div className="bg-panel border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">Fleeting Notes</h2>
          <span className="text-xs text-text-muted bg-panel-hover px-2 py-0.5 rounded-full">Phase 6</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[
            'Follow up with Marcus on tax extension',
            'Book recovery massage before race',
            'Check Q1 variance vs forecast',
            'Research HR software options',
            'Schedule annual physical',
          ].map((note) => (
            <div
              key={note}
              className="flex-shrink-0 w-40 h-28 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-text-primary"
            >
              {note}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
