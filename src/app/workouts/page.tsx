export default function WorkoutsPage() {
  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-text-primary mb-1">Workouts</h1>
          <p className="text-text-muted text-sm">GPX/FIT import from Coros, route maps, and training log.</p>
        </div>
        <div className="bg-panel border border-border rounded-xl p-10 text-center">
          <div className="text-4xl mb-4">◈</div>
          <h2 className="text-lg font-medium text-text-primary mb-2">Coming in Phase 7</h2>
          <p className="text-text-muted text-sm max-w-sm mx-auto">
            Import GPX/FIT files via drag-drop, Leaflet route maps, pace/HR charts, and manual entry for gym sessions.
          </p>
        </div>
      </div>
    </div>
  )
}
