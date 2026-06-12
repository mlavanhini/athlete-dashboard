export default function TasksPage() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-text-primary mb-1">Tasks</h1>
          <p className="text-text-muted text-sm">Native task management with projects, priorities, and recurrence.</p>
        </div>
        <div className="bg-panel border border-border rounded-xl p-10 text-center">
          <div className="text-4xl mb-4">✓</div>
          <h2 className="text-lg font-medium text-text-primary mb-2">Coming in Phase 2</h2>
          <p className="text-text-muted text-sm max-w-sm mx-auto">
            Full CRUD, quick-add parsing, recurrence rules, weekly goals, subtasks, and keyboard-first navigation.
          </p>
        </div>
      </div>
    </div>
  )
}
