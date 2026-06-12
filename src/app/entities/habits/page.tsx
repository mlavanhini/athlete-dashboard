export default function HabitsPage() {
  const habits = [
    { name: 'Morning Run', streak: 12, frequency: 'Daily', keyElement: 'Health' },
    { name: 'Daily Journaling', streak: 8, frequency: 'Daily', keyElement: 'Personal Growth' },
    { name: 'Weekly Financial Review', streak: 6, frequency: 'Weekly', keyElement: 'Finances' },
    { name: 'Evening Reading', streak: 21, frequency: 'Daily', keyElement: 'Personal Growth' },
    { name: 'Strength Training', streak: 4, frequency: '3x/week', keyElement: 'Health' },
    { name: 'Meditation', streak: 15, frequency: 'Daily', keyElement: 'Personal Growth' },
    { name: 'Weekly Review', streak: 9, frequency: 'Weekly', keyElement: 'Craft' },
  ]
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary mb-1">Habits</h1>
            <p className="text-text-muted text-sm">{habits.length} active habits</p>
          </div>
          <button className="px-4 py-2 bg-accent text-black text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors">+ New Habit</button>
        </div>
        <div className="space-y-2">
          {habits.map((h) => (
            <div key={h.name} className="bg-panel border border-border rounded-xl px-5 py-4 flex items-center justify-between hover:border-accent/30 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <span className="text-text-muted text-lg">↻</span>
                <div>
                  <p className="text-sm font-medium text-text-primary">{h.name}</p>
                  <p className="text-xs text-text-muted">{h.frequency} · {h.keyElement}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-accent text-sm font-semibold">{h.streak}</span>
                <span className="text-xs text-text-muted">day streak</span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-text-muted text-center italic">Full entity editor coming in Phase 5</p>
      </div>
    </div>
  )
}
