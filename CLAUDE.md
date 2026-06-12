# Life Cockpit — Working Memory

## Stack

- **Framework:** Next.js 15 (App Router), TypeScript, port 4317
- **Styling:** Tailwind CSS with custom dark theme tokens (see `tailwind.config.ts`)
- **Database:** better-sqlite3, WAL mode, file at `data/cockpit.db`
- **Vault:** Obsidian-compatible Markdown files in `vault/`
- **Migrations:** SQL files in `migrations/`, auto-run on startup via `src/lib/migrations.ts`
- **Fonts:** Geist Sans / Geist Mono via `next/font/google`
- **Package manager:** npm

## Key Conventions

- All schema changes go through new migration files (never edit existing ones)
- Vault writes must go through the vault engine (Phase 1+) — never write raw files from UI components
- All timestamps stored as UTC ISO strings
- Entity IDs are UUIDs (use `crypto.randomUUID()`)
- Files are source of truth for notes/entities; SQLite is source of truth for tasks/structured data
- `getDb()` in `src/lib/db.ts` returns the singleton DB connection
- `'use client'` required on any component that uses navigation hooks (Sidebar, etc.)

## Directory Structure

```
src/app/          Next.js App Router pages and layouts
src/components/   Shared React components (Sidebar, etc.)
src/lib/          Server-side utilities (db, migrations)
src/server/       Server modules (gcal sync — Phase 4+)
migrations/       Versioned SQL migration files (001_, 002_, ...)
vault/            Obsidian-compatible Markdown vault (source of truth for knowledge)
data/             SQLite database — gitignored, created at runtime
scripts/          CLI scripts: seed.ts, rebuild-index.ts
```

## Vault Structure

```
vault/
  Journal/          YYYY-MM-DD.md daily notes
  Fleeting Notes/   Quick captures
  People/           Person entities
  Organizations/    Org entities
  Projects/         Project entities
  Topics/           Topic entities
  Key Elements/     Life areas (Business, Health, Family, Finances, Craft, Personal Growth)
  Goals/            Goal entities
  Habits/           Habit entities
  Documents/        Reference docs and deliverables
  _attachments/     Images and files (gitignored)
```

## Schema Summary

See `migrations/001_initial.sql` for full DDL. Key tables:

| Table | Purpose |
|-------|---------|
| `notes_index` | Derived index of vault files (rebuilt via `rebuild-index` script) |
| `links` | Wikilink graph (source_id → target_id) |
| `tasks` | Native task management (no Todoist) |
| `time_blocks` | Calendar/planner blocks |
| `gcal_calendars` | Enabled Google Calendar list |
| `gcal_events` | Google Calendar mirror |
| `sync_queue` | Outbound GCal operations queue |
| `sync_conflicts` | Conflict log (last-write-wins, surfaced in Settings) |
| `health_metrics` | Weight, HRV, RHR, sleep, mood, etc. |
| `lab_results` | Blood work and lab values |
| `workouts` | Coros/manual workout log |
| `whiteboards` | React Flow board JSON |
| `ai_threads` / `ai_messages` | AI discussion threads per note |
| `settings` | OAuth tokens, user prefs, timezone |
| `notes_fts` | FTS5 full-text search (migration 002) |

## Phase Checklist

- [x] **Phase 0** — Scaffold: dark shell, sidebar nav, SQLite migrations, vault seed, CLAUDE.md
- [ ] **Phase 1** — Vault engine: frontmatter parser, indexer, FTS5, chokidar watcher, wikilinks, backlinks, `rebuild-index`
- [ ] **Phase 2** — Tasks: full CRUD, recurrence (RRULE), weekly goals, quick-add parsing, subtasks
- [ ] **Phase 3** — Planner (local): week grid, DnD schedule, resize/move blocks, time blocks persist
- [ ] **Phase 4** — Google Calendar sync: OAuth, pull/push loop, conflict resolution, planner renders GCal events
- [ ] **Phase 5** — Entities & notes UI: CodeMirror editor, metadata forms, backlinks, Cmd-K search
- [ ] **Phase 6** — Hub + Journal + Fleeting notes: live Hub, daily journal editor, sticky→task conversion
- [ ] **Phase 7** — Health & Workouts: metric tiles, sparklines, labs, CSV/GPX/FIT import
- [ ] **Phase 8** — Whiteboards + Knowledge Graph: React Flow boards, force-directed graph
- [ ] **Phase 9** — AI panel + Settings + polish: streaming chat, backup button, keyboard shortcuts, `npm run cockpit`

## Decisions & Deviations

- **Phase 0:** Using Geist font (next/font/google) — cleanest Next.js 15 default, matches design spec
- **Phase 0:** FTS5 in separate migration (002) to avoid conflicts with main schema setup
- **Phase 0:** The old HTML files (index.html, calendar.html, etc.) in repo root are left in place — unrelated to the app
- **Phase 0:** `data/` directory is gitignored — SQLite db is local-only, rebuilt via `npm run seed`
- **Phase 0:** `vault/_attachments/` is gitignored — large binary files not for version control

## Secrets (.env.local — never commit)

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ANTHROPIC_API_KEY=
```

## Quick Commands

```bash
npm run cockpit          # Start dev server at :4317
npm run seed             # Populate SQLite from vault + seed data
npm run rebuild-index    # Re-derive notes_index from vault files
npm run build            # Production build
```
