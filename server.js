#!/usr/bin/env node
// MCP-powered todo server — serves static files + JSON data API
// No npm deps: uses Node.js built-ins only
// Run: node server.js [port]   (default port 3000)

const http  = require('http')
const fs    = require('fs')
const path  = require('path')
const PORT  = parseInt(process.argv[2] || process.env.PORT || '3000')
const ROOT  = __dirname
const DATA  = path.join(ROOT, 'data')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.ico':  'image/x-icon',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function json(res, status, data) {
  cors(res)
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')) }
  catch { return fallback }
}

function writeJSON(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

const server = http.createServer((req, res) => {
  const url    = new URL(req.url, `http://localhost:${PORT}`)
  const p      = url.pathname

  if (req.method === 'OPTIONS') { cors(res); res.writeHead(204); res.end(); return }

  // ── API routes ──────────────────────────────────────────────
  if (p.startsWith('/api/')) {

    // GET /api/events — merged GCal + Outlook events
    if (p === '/api/events' && req.method === 'GET') {
      const gcal    = readJSON(path.join(DATA, 'gcal.json'),    [])
      const outlook = readJSON(path.join(DATA, 'outlook.json'), [])
      return json(res, 200, [...gcal, ...outlook])
    }

    // GET /api/todos — server-side todo store (mirrors localStorage backup)
    if (p === '/api/todos' && req.method === 'GET') {
      const craft = readJSON(path.join(DATA, 'craft-tasks.json'), [])
      const local  = readJSON(path.join(DATA, 'todos.json'), [])
      // Merge: craft tasks first, then manual todos not in craft
      const craftIds = new Set(craft.map(t => t.id))
      const merged = [...craft, ...local.filter(t => !craftIds.has(t.id))]
      return json(res, 200, merged)
    }

    // POST /api/todos — save full todo list (browser localStorage backup)
    if (p === '/api/todos' && req.method === 'POST') {
      let body = ''
      req.on('data', c => body += c)
      req.on('end', () => {
        try {
          const todos = JSON.parse(body)
          writeJSON(path.join(DATA, 'todos.json'), todos)
          return json(res, 200, { ok: true })
        } catch { return json(res, 400, { error: 'invalid JSON' }) }
      })
      return
    }

    // POST /api/queue/gcal — queue a GCal event creation (processed by Claude MCP)
    if (p === '/api/queue/gcal' && req.method === 'POST') {
      let body = ''
      req.on('data', c => body += c)
      req.on('end', () => {
        try {
          const event = JSON.parse(body)
          const qfile = path.join(DATA, 'gcal-queue.json')
          const queue = readJSON(qfile, [])
          queue.push({ ...event, queuedAt: new Date().toISOString() })
          writeJSON(qfile, queue)
          return json(res, 202, { ok: true, queued: true, message: 'Event queued. Ask Claude Code to process the queue to create it in Google Calendar.' })
        } catch { return json(res, 400, { error: 'invalid JSON' }) }
      })
      return
    }

    // POST /api/queue/outlook — queue an Outlook event creation
    if (p === '/api/queue/outlook' && req.method === 'POST') {
      let body = ''
      req.on('data', c => body += c)
      req.on('end', () => {
        try {
          const event = JSON.parse(body)
          const qfile = path.join(DATA, 'outlook-queue.json')
          const queue = readJSON(qfile, [])
          queue.push({ ...event, queuedAt: new Date().toISOString() })
          writeJSON(qfile, queue)
          return json(res, 202, { ok: true, queued: true, message: 'Event queued. Ask Claude Code to process the queue.' })
        } catch { return json(res, 400, { error: 'invalid JSON' }) }
      })
      return
    }

    // POST /api/queue/craft — queue a Craft task creation
    if (p === '/api/queue/craft' && req.method === 'POST') {
      let body = ''
      req.on('data', c => body += c)
      req.on('end', () => {
        try {
          const task = JSON.parse(body)
          const qfile = path.join(DATA, 'craft-queue.json')
          const queue = readJSON(qfile, [])
          queue.push({ ...task, queuedAt: new Date().toISOString() })
          writeJSON(qfile, queue)
          return json(res, 202, { ok: true, queued: true })
        } catch { return json(res, 400, { error: 'invalid JSON' }) }
      })
      return
    }

    // GET /api/sync-status
    if (p === '/api/sync-status' && req.method === 'GET') {
      const meta    = readJSON(path.join(DATA, 'sync-meta.json'), {})
      const gcalQ   = readJSON(path.join(DATA, 'gcal-queue.json'), []).length
      const outlookQ = readJSON(path.join(DATA, 'outlook-queue.json'), []).length
      const craftQ  = readJSON(path.join(DATA, 'craft-queue.json'), []).length
      return json(res, 200, { ...meta, pendingGcal: gcalQ, pendingOutlook: outlookQ, pendingCraft: craftQ })
    }

    return json(res, 404, { error: 'not found' })
  }

  // ── Static file serving ──────────────────────────────────────
  let filePath = path.join(ROOT, p === '/' ? '/todo.html' : p)
  // Prevent directory traversal
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end(); return }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      // Try adding .html
      fs.stat(filePath + '.html', (e2, s2) => {
        if (!e2 && s2.isFile()) serveFile(res, filePath + '.html')
        else { res.writeHead(404); res.end('Not found') }
      })
      return
    }
    serveFile(res, filePath)
  })
})

function serveFile(res, filePath) {
  const ext  = path.extname(filePath).toLowerCase()
  const mime = MIME[ext] || 'application/octet-stream'
  cors(res)
  res.writeHead(200, { 'Content-Type': mime })
  fs.createReadStream(filePath).pipe(res)
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  Todo server running at http://localhost:${PORT}\n`)
  console.log(`  Open http://localhost:${PORT} in your browser`)
  console.log(`  Access from iPhone: http://<your-laptop-IP>:${PORT}\n`)
  console.log(`  Serving data from: ${DATA}`)
  console.log(`  Synced via Claude Code MCP (Google Calendar + Outlook + Craft)\n`)
})
