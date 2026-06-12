export default function KeyElementsPage() {
  const elements = [
    { name: 'Business', desc: 'Career, work, professional growth', color: 'bg-blue-500/20 text-blue-400' },
    { name: 'Health', desc: 'Physical fitness, nutrition, medical', color: 'bg-green-500/20 text-green-400' },
    { name: 'Family', desc: 'Relationships, home, community', color: 'bg-purple-500/20 text-purple-400' },
    { name: 'Finances', desc: 'Personal finance, investments, planning', color: 'bg-accent/20 text-accent' },
    { name: 'Craft', desc: 'Skills, systems, tools, side projects', color: 'bg-orange-500/20 text-orange-400' },
    { name: 'Personal Growth', desc: 'Learning, mindfulness, identity', color: 'bg-rose-500/20 text-rose-400' },
  ]
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary mb-1">Key Elements</h1>
            <p className="text-text-muted text-sm">The {elements.length} life areas that matter most</p>
          </div>
          <button className="px-4 py-2 bg-accent text-black text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors">+ New Element</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {elements.map((e) => (
            <div key={e.name} className="bg-panel border border-border rounded-xl p-6 hover:border-accent/30 transition-colors cursor-pointer">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${e.color} text-xl mb-4`}>◆</div>
              <h3 className="text-sm font-semibold text-text-primary mb-1">{e.name}</h3>
              <p className="text-xs text-text-muted">{e.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-text-muted text-center italic">Full entity editor coming in Phase 5</p>
      </div>
    </div>
  )
}
