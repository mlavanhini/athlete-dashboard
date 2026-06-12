export default function JournalPage() {
  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-text-primary mb-1">Journal</h1>
          <p className="text-text-muted text-sm">One file per day — log, gratitude, and photos.</p>
        </div>
        <div className="bg-panel border border-border rounded-xl p-10 text-center">
          <div className="text-4xl mb-4">◉</div>
          <h2 className="text-lg font-medium text-text-primary mb-2">Coming in Phase 6</h2>
          <p className="text-text-muted text-sm max-w-sm mx-auto">
            Daily Markdown journal with calendar-strip navigation, image paste, and a daily context strip showing completed tasks and workouts.
          </p>
        </div>
      </div>
    </div>
  )
}
