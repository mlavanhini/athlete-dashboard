export default function DocumentsPage() {
  const docs = [
    { name: 'Q4 2025 Financial Report', updated: '2026-01-15', type: 'Report' },
    { name: '2026 Training Plan', updated: '2026-01-01', type: 'Plan' },
    { name: 'Personal Financial Plan', updated: '2026-02-10', type: 'Plan' },
    { name: 'Annual Health Review', updated: '2026-03-01', type: 'Report' },
    { name: 'Running Race Calendar', updated: '2026-01-20', type: 'Reference' },
    { name: 'Board Presentation Template', updated: '2025-12-01', type: 'Template' },
  ]
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary mb-1">Documents</h1>
            <p className="text-text-muted text-sm">{docs.length} documents in your vault</p>
          </div>
          <button className="px-4 py-2 bg-accent text-black text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors">+ New Document</button>
        </div>
        <div className="space-y-2">
          {docs.map((d) => (
            <div key={d.name} className="bg-panel border border-border rounded-xl px-5 py-4 flex items-center justify-between hover:border-accent/30 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <span className="text-text-muted text-lg">▤</span>
                <div>
                  <p className="text-sm font-medium text-text-primary">{d.name}</p>
                  <p className="text-xs text-text-muted">Updated {d.updated}</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-panel-hover text-text-muted rounded-full">{d.type}</span>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-text-muted text-center italic">Full entity editor coming in Phase 5</p>
      </div>
    </div>
  )
}
