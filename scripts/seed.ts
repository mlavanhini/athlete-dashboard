import Database from 'better-sqlite3'
import matter from 'gray-matter'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

const DB_PATH = path.join(process.cwd(), 'data', 'cockpit.db')
const VAULT_PATH = path.join(process.cwd(), 'vault')
const MIGRATIONS_PATH = path.join(process.cwd(), 'migrations')

// Run migrations
function runMigrations(db: Database.Database) {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL
  )`)

  const files = fs.readdirSync(MIGRATIONS_PATH)
    .filter(f => f.endsWith('.sql'))
    .sort()

  const applied = db.prepare('SELECT version FROM schema_migrations').all() as { version: number }[]
  const appliedVersions = new Set(applied.map(r => r.version))

  for (const file of files) {
    const version = parseInt(file.split('_')[0], 10)
    if (appliedVersions.has(version)) continue
    const sql = fs.readFileSync(path.join(MIGRATIONS_PATH, file), 'utf-8')
    db.exec(sql)
    db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(
      version, new Date().toISOString()
    )
    console.log(`Applied migration: ${file}`)
  }
}

// Index vault files
function indexVault(db: Database.Database) {
  const insertNote = db.prepare(`
    INSERT OR REPLACE INTO notes_index (id, type, title, path, created, updated, frontmatter_json)
    VALUES (@id, @type, @title, @path, @created, @updated, @frontmatter_json)
  `)

  let count = 0
  function walkDir(dir: string) {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walkDir(fullPath)
      } else if (entry.name.endsWith('.md')) {
        const content = fs.readFileSync(fullPath, 'utf-8')
        const { data } = matter(content)
        if (!data.id) continue

        const toStr = (v: unknown): string =>
          v instanceof Date ? v.toISOString() : String(v ?? new Date().toISOString())
        const relPath = path.relative(VAULT_PATH, fullPath)
        try {
          insertNote.run({
            id: String(data.id),
            type: String(data.type || 'note'),
            title: String(data.title || path.basename(entry.name, '.md')),
            path: relPath,
            created: toStr(data.created),
            updated: toStr(data.updated),
            frontmatter_json: JSON.stringify(data, (_k, v) =>
              v instanceof Date ? v.toISOString() : v
            ),
          })
          count++
        } catch (err) {
          console.error(`Failed to insert ${relPath}:`, err)
        }
      }
    }
  }

  walkDir(VAULT_PATH)
  console.log(`Indexed ${count} vault files`)
}

// Seed tasks
function seedTasks(db: Database.Database) {
  const existing = db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number }
  if (existing.count > 0) {
    console.log('Tasks already seeded, skipping')
    return
  }

  const insert = db.prepare(`
    INSERT INTO tasks (id, title, notes, project_id, due_date, priority, status, is_weekly_goal, created_at, updated_at)
    VALUES (@id, @title, @notes, @project_id, @due_date, @priority, @status, @is_weekly_goal, @created_at, @updated_at)
  `)

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  const friday = (() => {
    const d = new Date()
    d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7))
    return d.toISOString().split('T')[0]
  })()
  const saturday = new Date(Date.now() + ((6 - new Date().getDay() + 7) % 7 || 7) * 86400000).toISOString().split('T')[0]
  const now = new Date().toISOString()

  const tasks = [
    { title: 'Review Q2 variance analysis', notes: 'Focus on cost center 7 anomaly', project_id: null, due_date: today, priority: 1, status: 'open', is_weekly_goal: 1 },
    { title: 'Submit expense reports', notes: null, project_id: null, due_date: tomorrow, priority: 2, status: 'open', is_weekly_goal: 0 },
    { title: 'Long run — 18 miles', notes: '9:30 pace, fuel every 45 min', project_id: null, due_date: saturday, priority: 2, status: 'open', is_weekly_goal: 1 },
    { title: 'Prep board presentation slides', notes: 'Q2 close deck for Sarah review', project_id: null, due_date: nextWeek, priority: 1, status: 'open', is_weekly_goal: 1 },
    { title: 'Call Dr. Reyes — follow up bloodwork', notes: 'May bloodwork results pending', project_id: null, due_date: friday, priority: 2, status: 'open', is_weekly_goal: 0 },
    { title: 'Update cash flow forecast', notes: 'Through Q3', project_id: null, due_date: friday, priority: 2, status: 'open', is_weekly_goal: 0 },
    { title: 'Strength training', notes: 'CrossFit — scale leg work', project_id: null, due_date: today, priority: 3, status: 'open', is_weekly_goal: 0 },
    { title: 'Review investment portfolio', notes: 'Roth rebalancing to 3-fund', project_id: null, due_date: nextWeek, priority: 3, status: 'open', is_weekly_goal: 0 },
    { title: 'Meditation practice', notes: '10 minutes', project_id: null, due_date: today, priority: 3, status: 'open', is_weekly_goal: 0 },
    { title: 'Weekly financial review', notes: 'Accounts, transactions, net worth update', project_id: null, due_date: friday, priority: 2, status: 'open', is_weekly_goal: 1 },
  ]

  for (const task of tasks) {
    insert.run({ ...task, id: randomUUID(), created_at: now, updated_at: now })
  }
  console.log(`Seeded ${tasks.length} tasks`)
}

// Seed health metrics
function seedHealthMetrics(db: Database.Database) {
  const existing = db.prepare('SELECT COUNT(*) as count FROM health_metrics').get() as { count: number }
  if (existing.count > 0) {
    console.log('Health metrics already seeded, skipping')
    return
  }

  const insert = db.prepare(`
    INSERT INTO health_metrics (id, metric, value, unit, measured_at, source, note)
    VALUES (@id, @metric, @value, @unit, @measured_at, @source, @note)
  `)

  const rows: Array<{ metric: string; value: number; unit: string; source: string }> = []

  for (let i = 30; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const dateStr = d.toISOString().split('T')[0] + 'T07:00:00Z'

    // Weight: 186 → 181 lbs with noise
    const weightBase = 186 - (i / 30) * 5
    rows.push({ metric: 'weight', value: parseFloat((weightBase + (Math.random() - 0.5) * 0.8).toFixed(1)), unit: 'lbs', source: 'manual' })

    // Resting HR: 52-58 bpm
    rows.push({ metric: 'resting_hr', value: Math.round(52 + Math.random() * 6), unit: 'bpm', source: 'whoop' })

    // HRV: 55-75 ms
    rows.push({ metric: 'hrv', value: Math.round(58 + Math.random() * 17), unit: 'ms', source: 'whoop' })

    // Sleep: 6.5-8.5 hrs
    rows.push({ metric: 'sleep', value: parseFloat((7.0 + (Math.random() - 0.3) * 2).toFixed(1)), unit: 'hours', source: 'whoop' })

    // Mood: 3-5
    rows.push({ metric: 'mood', value: Math.round(3 + Math.random() * 2), unit: '1-5', source: 'manual' })
  }

  const insertWithDate = db.prepare(`
    INSERT INTO health_metrics (id, metric, value, unit, measured_at, source, note)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  for (let i = 30; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const dateStr = d.toISOString().split('T')[0] + 'T07:00:00Z'

    const weightBase = 186 - ((30 - i) / 30) * 5
    insertWithDate.run(randomUUID(), 'weight', parseFloat((weightBase + (Math.random() - 0.5) * 0.8).toFixed(1)), 'lbs', dateStr, 'manual', null)
    insertWithDate.run(randomUUID(), 'resting_hr', Math.round(52 + Math.random() * 6), 'bpm', dateStr, 'whoop', null)
    insertWithDate.run(randomUUID(), 'hrv', Math.round(58 + Math.random() * 17), 'ms', dateStr, 'whoop', null)
    insertWithDate.run(randomUUID(), 'sleep', parseFloat((7.0 + (Math.random() - 0.3) * 2).toFixed(1)), 'hours', dateStr, 'whoop', null)
    insertWithDate.run(randomUUID(), 'mood', Math.round(3 + Math.random() * 2), '1-5', dateStr, 'manual', null)
  }

  const count = db.prepare('SELECT COUNT(*) as count FROM health_metrics').get() as { count: number }
  console.log(`Seeded ${count.count} health metric rows`)
}

// Main
const dataDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

runMigrations(db)
indexVault(db)
seedTasks(db)
seedHealthMetrics(db)

db.close()
console.log('Seed complete.')
