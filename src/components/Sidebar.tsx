'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href?: string
  label: string
  icon?: string
  type?: 'section' | 'divider'
}

const navItems: NavItem[] = [
  { href: '/hub', label: 'Hub', icon: '⌂' },
  { href: '/tasks', label: 'Tasks', icon: '✓' },
  { href: '/planner', label: 'Weekly Planner', icon: '◫' },
  { type: 'section', label: 'KNOWLEDGE' },
  { href: '/journal', label: 'Journal', icon: '◉' },
  { href: '/entities/people', label: 'People', icon: '◎' },
  { href: '/entities/organizations', label: 'Organizations', icon: '⬡' },
  { href: '/entities/projects', label: 'Projects', icon: '◈' },
  { href: '/entities/topics', label: 'Topics', icon: '◇' },
  { href: '/entities/key-elements', label: 'Key Elements', icon: '◆' },
  { href: '/entities/goals', label: 'Goals', icon: '◎' },
  { href: '/entities/habits', label: 'Habits', icon: '↻' },
  { href: '/entities/documents', label: 'Documents', icon: '▤' },
  { type: 'section', label: 'LIFE' },
  { href: '/health', label: 'Health & Life', icon: '♡' },
  { href: '/workouts', label: 'Workouts', icon: '◈' },
  { type: 'section', label: 'TOOLS' },
  { href: '/whiteboards', label: 'Whiteboards', icon: '⬚' },
  { href: '/graph', label: 'Knowledge Graph', icon: '⬡' },
  { href: '/ai', label: 'AI Discussion', icon: '✦' },
  { type: 'divider', label: '' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-[220px] flex-shrink-0 flex flex-col border-r border-border bg-[#16161A] overflow-y-auto">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-accent flex items-center justify-center text-xs font-bold text-black">L</div>
          <span className="text-sm font-semibold text-text-primary tracking-wide">Life Cockpit</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2">
        {navItems.map((item, idx) => {
          if (item.type === 'section') {
            return (
              <div key={idx} className="px-2 pt-4 pb-1">
                <span className="text-[10px] font-semibold tracking-widest text-text-muted uppercase">
                  {item.label}
                </span>
              </div>
            )
          }
          if (item.type === 'divider') {
            return <div key={idx} className="my-2 border-t border-border mx-2" />
          }

          const isActive = pathname === item.href ||
            (item.href !== '/hub' && pathname.startsWith(item.href!))

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={`
                flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors duration-100
                ${isActive
                  ? 'bg-accent/15 text-accent font-medium'
                  : 'text-text-muted hover:text-text-primary hover:bg-panel-hover'
                }
              `}
            >
              <span className="text-base w-4 text-center leading-none select-none">
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border">
        <p className="text-[10px] text-text-muted">Phase 0 — Scaffold</p>
      </div>
    </aside>
  )
}
