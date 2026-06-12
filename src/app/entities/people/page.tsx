export default function PeoplePage() {
  const people = [
    { name: 'Sarah Chen', role: 'CFO, Apex Financial Group', tags: ['work', 'leadership'] },
    { name: 'Marcus Williams', role: 'CPA, External Accountant', tags: ['work', 'finance'] },
    { name: 'Dr. Elena Reyes', role: 'Primary Care Physician', tags: ['health'] },
    { name: 'Tom Bradley', role: 'Running Coach', tags: ['health', 'running'] },
    { name: 'David Park', role: 'Close Friend, Runner', tags: ['personal', 'running'] },
    { name: 'Lisa Torres', role: 'Staff Accountant', tags: ['work'] },
    { name: 'Jamie Rodriguez', role: 'Nutritionist', tags: ['health'] },
    { name: 'Alex Kupfer', role: 'Physiotherapist', tags: ['health', 'running'] },
  ]

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary mb-1">People</h1>
            <p className="text-text-muted text-sm">{people.length} contacts in your vault</p>
          </div>
          <button className="px-4 py-2 bg-accent text-black text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors">
            + New Person
          </button>
        </div>

        <div className="space-y-2">
          {people.map((p) => (
            <div
              key={p.name}
              className="bg-panel border border-border rounded-xl px-5 py-4 flex items-center justify-between hover:border-accent/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-semibold">
                  {p.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{p.name}</p>
                  <p className="text-xs text-text-muted">{p.role}</p>
                </div>
              </div>
              <div className="flex gap-1.5">
                {p.tags.map(tag => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 bg-panel-hover text-text-muted rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-text-muted text-center italic">
          Full entity editor with Markdown body, backlinks, and wikilinks coming in Phase 5
        </p>
      </div>
    </div>
  )
}
