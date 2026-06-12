export default function GoalsPage() {
  const goals = [
    { name: 'Run Boston Marathon Sub-3:30', target: 'April 2026', progress: 65, keyElement: 'Health' },
    { name: 'Achieve CPA Certification', target: 'December 2026', progress: 30, keyElement: 'Business' },
    { name: 'Build 6-Month Emergency Fund', target: 'September 2026', progress: 80, keyElement: 'Finances' },
    { name: 'Lose 10 Pounds by Summer', target: 'July 2026', progress: 40, keyElement: 'Health' },
    { name: 'Read 24 Books This Year', target: 'December 2026', progress: 50, keyElement: 'Personal Growth' },
    { name: 'Launch Side Consulting Practice', target: 'December 2026', progress: 10, keyElement: 'Business' },
  ]
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary mb-1">Goals</h1>
            <p className="text-text-muted text-sm">{goals.length} active goals</p>
          </div>
          <button className="px-4 py-2 bg-accent text-black text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors">+ New Goal</button>
        </div>
        <div className="space-y-3">
          {goals.map((g) => (
            <div key={g.name} className="bg-panel border border-border rounded-xl p-5 hover:border-accent/30 transition-colors cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">{g.name}</p>
                  <p className="text-xs text-text-muted mt-0.5">{g.keyElement} · Target: {g.target}</p>
                </div>
                <span className="text-sm font-semibold text-accent">{g.progress}%</span>
              </div>
              <div className="w-full bg-panel-hover rounded-full h-1.5">
                <div className="bg-accent h-1.5 rounded-full" style={{ width: `${g.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-text-muted text-center italic">Full entity editor coming in Phase 5</p>
      </div>
    </div>
  )
}
