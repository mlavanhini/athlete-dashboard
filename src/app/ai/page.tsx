export default function AIPage() {
  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-text-primary mb-1">AI Discussion</h1>
          <p className="text-text-muted text-sm">Chat with Claude about any note, entity, or idea — with vault context.</p>
        </div>
        <div className="bg-panel border border-border rounded-xl p-10 text-center">
          <div className="text-4xl mb-4">✦</div>
          <h2 className="text-lg font-medium text-text-primary mb-2">Coming in Phase 9</h2>
          <p className="text-text-muted text-sm max-w-sm mx-auto">
            Side-panel chat on any note with streamed responses. Context = note body + frontmatter + 1-hop linked notes. Threads persist per note.
          </p>
        </div>
      </div>
    </div>
  )
}
