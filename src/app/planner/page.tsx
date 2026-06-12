export default function PlannerPage() {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-text-primary mb-1">Weekly Planner</h1>
          <p className="text-text-muted text-sm">Drag-and-drop week grid with Google Calendar sync.</p>
        </div>
        <div className="bg-panel border border-border rounded-xl p-10 text-center">
          <div className="text-4xl mb-4">◫</div>
          <h2 className="text-lg font-medium text-text-primary mb-2">Coming in Phase 3</h2>
          <p className="text-text-muted text-sm max-w-sm mx-auto">
            Week grid (Mon–Sun), 30-min rows, drag-to-schedule, resize blocks, and a Google Calendar event layer in Phase 4.
          </p>
        </div>
      </div>
    </div>
  )
}
