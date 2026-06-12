export default function OrganizationsPage() {
  const orgs = [
    { name: 'Apex Financial Group', type: 'Employer', members: 3 },
    { name: 'Coros Athletics', type: 'Vendor / Sports Tech', members: 1 },
    { name: 'Whoop Inc.', type: 'Vendor / Health Tech', members: 1 },
    { name: 'Blue Cross Health', type: 'Insurance Provider', members: 2 },
    { name: 'CrossFit Box', type: 'Gym', members: 1 },
    { name: 'Running Club', type: 'Community', members: 2 },
  ]

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary mb-1">Organizations</h1>
            <p className="text-text-muted text-sm">{orgs.length} organizations in your vault</p>
          </div>
          <button className="px-4 py-2 bg-accent text-black text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors">
            + New Organization
          </button>
        </div>
        <div className="space-y-2">
          {orgs.map((o) => (
            <div key={o.name} className="bg-panel border border-border rounded-xl px-5 py-4 flex items-center justify-between hover:border-accent/30 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-lg bg-panel-hover border border-border flex items-center justify-center text-text-muted text-sm font-bold">
                  {o.name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{o.name}</p>
                  <p className="text-xs text-text-muted">{o.type}</p>
                </div>
              </div>
              <span className="text-xs text-text-muted">{o.members} people</span>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-text-muted text-center italic">Full entity editor coming in Phase 5</p>
      </div>
    </div>
  )
}
