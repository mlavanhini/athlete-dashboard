export default function WhiteboardsPage() {
  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-text-primary mb-1">Whiteboards</h1>
          <p className="text-text-muted text-sm">React Flow canvases for visual thinking and note connections.</p>
        </div>
        <div className="bg-panel border border-border rounded-xl p-10 text-center">
          <div className="text-4xl mb-4">⬚</div>
          <h2 className="text-lg font-medium text-text-primary mb-2">Coming in Phase 8</h2>
          <p className="text-text-muted text-sm max-w-sm mx-auto">
            Sticky notes, text nodes, note-embed nodes, free connections with editable edge labels. Boards persist as JSON.
          </p>
        </div>
      </div>
    </div>
  )
}
