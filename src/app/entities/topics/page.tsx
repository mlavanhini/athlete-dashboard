export default function TopicsPage() {
  const topics = [
    { name: 'Financial Reporting', notes: 4 },
    { name: 'Running Performance', notes: 7 },
    { name: 'Nutrition & Recovery', notes: 3 },
    { name: 'Mindfulness & Focus', notes: 2 },
    { name: 'Investment Strategy', notes: 5 },
    { name: 'Productivity Systems', notes: 6 },
  ]
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary mb-1">Topics</h1>
            <p className="text-text-muted text-sm">{topics.length} topics in your vault</p>
          </div>
          <button className="px-4 py-2 bg-accent text-black text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors">+ New Topic</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {topics.map((t) => (
            <div key={t.name} className="bg-panel border border-border rounded-xl p-5 hover:border-accent/30 transition-colors cursor-pointer">
              <div className="flex items-start justify-between">
                <span className="text-text-muted text-lg mb-3 block">◇</span>
                <span className="text-xs text-text-muted">{t.notes} notes</span>
              </div>
              <p className="text-sm font-medium text-text-primary">{t.name}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-text-muted text-center italic">Full entity editor coming in Phase 5</p>
      </div>
    </div>
  )
}
