export default function ProjectsPage() {
  const projects = [
    { name: 'Q2 Financial Close', status: 'active', keyElement: 'Business' },
    { name: 'Annual Budget 2026', status: 'active', keyElement: 'Business' },
    { name: 'ERP Modernization', status: 'active', keyElement: 'Business' },
    { name: 'Boston Marathon Training', status: 'active', keyElement: 'Health' },
    { name: 'Home Renovation', status: 'paused', keyElement: 'Family' },
    { name: 'Investment Portfolio Review', status: 'active', keyElement: 'Finances' },
    { name: 'Knowledge Management System', status: 'active', keyElement: 'Craft' },
  ]

  const statusColors: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400',
    paused: 'bg-yellow-500/20 text-yellow-400',
    done: 'bg-text-muted/20 text-text-muted',
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary mb-1">Projects</h1>
            <p className="text-text-muted text-sm">{projects.length} projects in your vault</p>
          </div>
          <button className="px-4 py-2 bg-accent text-black text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors">
            + New Project
          </button>
        </div>
        <div className="space-y-2">
          {projects.map((p) => (
            <div key={p.name} className="bg-panel border border-border rounded-xl px-5 py-4 flex items-center justify-between hover:border-accent/30 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <span className="text-text-muted text-lg">◈</span>
                <div>
                  <p className="text-sm font-medium text-text-primary">{p.name}</p>
                  <p className="text-xs text-text-muted">{p.keyElement}</p>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[p.status]}`}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-text-muted text-center italic">Full entity editor coming in Phase 5</p>
      </div>
    </div>
  )
}
