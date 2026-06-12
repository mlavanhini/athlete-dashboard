export default function SettingsPage() {
  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-text-primary mb-1">Settings</h1>
          <p className="text-text-muted text-sm">Connections, preferences, vault path, and backup.</p>
        </div>

        <div className="space-y-4">
          {[
            { title: 'Google Calendar', desc: 'OAuth 2.0 connection for two-way sync', phase: 'Phase 4', icon: '📅' },
            { title: 'Anthropic API', desc: 'API key for AI discussion panel', phase: 'Phase 9', icon: '✦' },
            { title: 'Vault Path', desc: 'Location of your Obsidian-compatible vault folder', phase: 'Phase 1', icon: '📁' },
            { title: 'Timezone', desc: 'Default: America/New_York', phase: 'Phase 0', icon: '🕐' },
            { title: 'Database Backup', desc: 'Export cockpit.db + vault to ~/CockpitBackups/', phase: 'Phase 9', icon: '💾' },
          ].map((item) => (
            <div key={item.title} className="bg-panel border border-border rounded-xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <h3 className="text-sm font-medium text-text-primary">{item.title}</h3>
                  <p className="text-xs text-text-muted mt-0.5">{item.desc}</p>
                </div>
              </div>
              <span className="text-xs text-text-muted bg-panel-hover px-2 py-0.5 rounded-full">{item.phase}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
