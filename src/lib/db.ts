import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { runMigrations } from './migrations'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db

  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  const dbPath = path.join(dataDir, 'cockpit.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  runMigrations(db)

  return db
}
