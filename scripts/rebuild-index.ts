import Database from 'better-sqlite3'
import matter from 'gray-matter'
import fs from 'fs'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'data', 'cockpit.db')
const VAULT_PATH = path.join(process.cwd(), 'vault')

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')

// Clear existing index
db.exec('DELETE FROM notes_index')
db.exec('DELETE FROM links')
console.log('Cleared existing index')

const insertNote = db.prepare(`
  INSERT OR REPLACE INTO notes_index (id, type, title, path, created, updated, frontmatter_json)
  VALUES (@id, @type, @title, @path, @created, @updated, @frontmatter_json)
`)

// Parse wikilinks from body
function parseWikilinks(body: string): string[] {
  const matches = body.matchAll(/\[\[([^\]]+)\]\]/g)
  return Array.from(matches).map(m => m[1])
}

let noteCount = 0
let linkCount = 0

function walkDir(dir: string) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === '_attachments') continue
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkDir(fullPath)
    } else if (entry.name.endsWith('.md')) {
      const content = fs.readFileSync(fullPath, 'utf-8')
      const { data, content: body } = matter(content)
      if (!data.id) {
        console.warn(`Skipping ${fullPath} — no id in frontmatter`)
        return
      }

      insertNote.run({
        id: data.id,
        type: data.type || 'note',
        title: data.title || path.basename(entry.name, '.md'),
        path: path.relative(VAULT_PATH, fullPath),
        created: data.created || new Date().toISOString(),
        updated: data.updated || new Date().toISOString(),
        frontmatter_json: JSON.stringify(data),
      })
      noteCount++

      // Parse and store wikilinks (we'll resolve targets in Phase 1)
      const wikilinks = parseWikilinks(body)
      for (const link of wikilinks) {
        // Store as unresolved for now — Phase 1 will resolve target IDs
        try {
          db.prepare(`INSERT OR IGNORE INTO links (source_id, target_id, context) VALUES (?, ?, ?)`)
            .run(data.id, link, null)
          linkCount++
        } catch {
          // ignore duplicate links
        }
      }
    }
  }
}

walkDir(VAULT_PATH)
db.close()
console.log(`Rebuild complete: ${noteCount} notes, ${linkCount} links indexed`)
