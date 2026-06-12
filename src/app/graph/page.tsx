export default function GraphPage() {
  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-text-primary mb-1">Knowledge Graph</h1>
          <p className="text-text-muted text-sm">Force-directed graph of your notes and their connections.</p>
        </div>
        <div className="bg-panel border border-border rounded-xl p-10 text-center">
          <div className="text-4xl mb-4">⬡</div>
          <h2 className="text-lg font-medium text-text-primary mb-2">Coming in Phase 8</h2>
          <p className="text-text-muted text-sm max-w-sm mx-auto">
            Force-directed graph of notes_index + links, colored by type, filterable, click node to open note. Local graph embedded on entity pages.
          </p>
        </div>
      </div>
    </div>
  )
}
