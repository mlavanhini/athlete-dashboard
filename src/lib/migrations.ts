import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

export function runMigrations(db: Database.Database) {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL
  )`)

  const migrationsDir = path.join(process.cwd(), 'migrations')
  if (!fs.existsSync(migrationsDir)) return

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  const applied = db.prepare('SELECT version FROM schema_migrations').all() as { version: number }[]
  const appliedVersions = new Set(applied.map(r => r.version))

  for (const file of files) {
    const version = parseInt(file.split('_')[0], 10)
    if (appliedVersions.has(version)) continue

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
    db.exec(sql)
    db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(
      version,
      new Date().toISOString()
    )
    console.log(`Applied migration: ${file}`)
  }
}
