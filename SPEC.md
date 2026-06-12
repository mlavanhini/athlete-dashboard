# Life Cockpit — Build Specification

A local-first personal knowledge & life management app (a "myPKA Cockpit"-style system): one dark-themed web app running on localhost that unifies notes, tasks, weekly planning, a CRM-style entity system, journal, health tracking, workouts, whiteboards, a knowledge graph, and an AI discussion panel — backed by plain Markdown files plus a single SQLite database.

**Two deliberate departures from the reference app:**

1. **No Todoist.** Tasks are managed natively in-app (SQLite-backed), with full project/priority/recurrence support.
1. **Two-way Google Calendar sync.** The weekly planner reads and writes Google Calendar directly: events created/edited/deleted in either place converge.

**Owner profile (design for this user):** finance controller, heavy Obsidian user, Coros/Whoop athlete, comfortable with Markdown and light scripting. The notes vault MUST stay Obsidian-compatible (YAML frontmatter + `[[wikilinks]]`) so the same folder can be opened in Obsidian at any time.

-----

## How to use this spec with Claude Code

1. Create an empty repo (`mkdir life-cockpit && cd life-cockpit && git init`).
1. Save this file as `SPEC.md` in the repo root.
1. Start Claude Code in the repo and use the kickoff prompt at the bottom of this document.
1. **Build one phase per session.** Each phase below has acceptance criteria — do not move on until they pass. Commit at the end of every phase.
1. Ask Claude Code to maintain a `CLAUDE.md` (created in Phase 0) recording stack decisions, schema, conventions, and current phase status, so every new session starts oriented.
1. Use plan mode for each phase before writing code; review the plan against this spec.

Claude Code docs, if needed: <https://docs.claude.com/en/docs/claude-code/overview>

-----

## 1. Architecture & principles

- **Local-first, single user.** Everything runs on the user's Mac/PC at `http://localhost:4317`. No accounts, no cloud backend. The only network calls are Google Calendar API and the Anthropic API.
- **Files are the source of truth for knowledge.** Notes, entities, journal entries = Markdown files with YAML frontmatter in a `vault/` directory. The app reads/writes these files directly; an index in SQLite is derived and rebuildable.
- **SQLite is the source of truth for structured data.** Tasks, time blocks, calendar event mirror, health metrics, labs, workouts, whiteboard JSON, sync state, AI chat history. One file: `data/cockpit.db` (WAL mode).
- **Crash-safe and rebuildable.** `vault/` + `cockpit.db` is a complete backup. A `rebuild-index` command re-derives the search/graph index from files.
- **Stack:**
  - Next.js (latest stable, App Router) + TypeScript, single repo, API routes for all server work
  - Tailwind CSS + a small component layer (shadcn/ui acceptable)
  - `better-sqlite3` with a thin typed DAO layer + versioned migrations (`migrations/00X_*.sql`)
  - `gray-matter` for frontmatter, `chokidar` to watch the vault for external edits (e.g., from Obsidian)
  - `googleapis` for Calendar; `@anthropic-ai/sdk` for the AI panel
  - Drag & drop: `@dnd-kit`; whiteboard: React Flow; maps: Leaflet + OpenStreetMap tiles; graph: `react-force-graph-2d`; charts: Recharts
  - `node-cron` or a simple `setInterval` in a singleton server module for the sync loop
- **Secrets** live in `.env.local` (gitignored): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ANTHROPIC_API_KEY`. Google OAuth tokens are stored in SQLite.
- **Design language:** near-black background (#0E0E10-ish), warm dark gray panels, amber/orange accent for focus states and "now" markers, generous whitespace, Inter or Geist font. Left sidebar navigation (sections, then entity types with counts). Match the calm, dense-but-readable feel of the reference app. Use the dark theme from day one — not a bolt-on.

## 2. Repository & vault layout

```
life-cockpit/
  CLAUDE.md            # working memory for Claude Code (Phase 0)
  SPEC.md              # this file
  .env.local
  data/cockpit.db
  vault/               # Obsidian-compatible — user may open this in Obsidian
    Journal/           # YYYY-MM-DD.md daily notes
    Fleeting Notes/    # quick captures + parking-lot stickies
    People/
    Organizations/
    Projects/
    Topics/
    Key Elements/      # life areas: Business, Craft, Family, Finances, Health...
    Goals/
    Habits/
    Documents/         # deliverables, reference docs
    _attachments/      # images, files
  src/...              # Next.js app
  migrations/
```

**Note file convention:** every entity/note is one `.md` file. Frontmatter carries `id` (uuid), `type`, `created`, `updated`, plus type-specific fields (e.g., Person: `email`, `phone`, `org` as wikilink, `tags`). Body is free Markdown with `[[wikilinks]]`. The indexer parses frontmatter + wikilinks into SQLite for search, backlinks, and the graph. File renames are reconciled by the `id` in frontmatter.

## 3. Database schema (core tables)

Use migrations; this is the shape, not literal DDL:

- `notes_index(id, type, title, path, created, updated, frontmatter_json)` — derived from vault
- `links(source_id, target_id, context)` — derived wikilinks
- `tasks(id, title, notes, project_id, key_element_id, due_date, due_time, duration_min, priority 1-4, status open|done|cancelled, rrule, is_weekly_goal, created_at, completed_at, updated_at)`
- `time_blocks(id, task_id NULLABLE, title, start, end, gcal_event_id NULLABLE, updated_at)`
- `gcal_calendars(google_id, summary, color, sync_enabled, sync_token, channel info)`
- `gcal_events(id, calendar_google_id, google_event_id, etag, title, start, end, all_day, location, description, status, google_updated, local_updated, dirty, deleted)`
- `sync_queue(id, op create|update|delete, payload_json, attempts, last_error, created_at)`
- `health_metrics(id, metric, value, unit, measured_at, source, note)` — weight, body_fat, hrv, rhr, sleep, mood, energy…
- `lab_results(id, analyte, value, unit, ref_low, ref_high, drawn_at, source)`
- `workouts(id, sport, start, duration_s, distance_m, avg_hr, avg_power, file_path, polyline, source, notes)`
- `whiteboards(id, title, json, updated_at)` + board↔note associations
- `ai_threads(id, subject_note_id, created_at)` / `ai_messages(thread_id, role, content, created_at)`
- `settings(key, value)` — OAuth tokens, sync prefs, timezone (default America/New_York)

-----

## 4. Google Calendar two-way sync (the critical subsystem)

Build this as an isolated module (`src/server/gcal/`) with its own tests before wiring UI.

**Auth.** OAuth 2.0 with a user-created Google Cloud project (Calendar API enabled, OAuth client of type "Web application", redirect `http://localhost:4317/api/gcal/callback`). Scopes: `https://www.googleapis.com/auth/calendar`. A Settings → Connections page runs the flow; refresh token persisted in `settings`. Include a `SETUP-GOOGLE.md` walking the user through Cloud Console in ~10 steps.

**Calendar selection.** After auth, list calendars; user toggles which to sync. Additionally, the app creates (or adopts) a dedicated **"Cockpit" calendar** used for task time blocks, so planner blocks don't pollute the primary calendar.

**Pull (Google → local).** Per enabled calendar: `events.list` with `syncToken` for incremental sync; on HTTP 410 do a full resync (windowed: -30 days to +365 days). Upsert into `gcal_events` keyed by `(calendar_google_id, google_event_id)`; honor `status=cancelled` as deletion. Run the pull loop every 60 seconds while the app is open, plus on window focus and after any local write. (Push notification channels require a public HTTPS URL — out of scope for localhost; document ngrok as an optional upgrade.)

**Push (local → Google).** Local create/edit/delete of an event or time block writes to SQLite, marks `dirty`, and enqueues into `sync_queue`. A worker drains the queue: `events.insert/patch/delete` with exponential backoff on 403/429/5xx. On success, store returned `id`, `etag`, `updated` and clear `dirty`. UI is optimistic.

**Conflict policy.** Before pushing a patch, send `If-Match: etag`. On 412 (precondition failed), fetch the remote event and resolve **last-write-wins** by comparing Google `updated` vs `local_updated`; the loser's version is recorded in a `sync_conflicts` log table surfaced in Settings. Deletions beat edits.

**Task ↔ event semantics.** Dragging a task onto the planner creates a `time_block` and a corresponding event on the Cockpit calendar titled with the task name (description carries `cockpit-task-id:<uuid>`). Moving/resizing the event in Google Calendar moves the block locally on next pull (match via the marker). Completing the task does NOT delete past blocks; deleting the block never deletes the task. Plain calendar events (meetings etc.) sync independently of tasks.

**Time zones.** Store all instants as UTC ISO strings + original tz; render in the user's tz (settings, default America/New_York). All-day events use date-only fields, never midnight timestamps.

**Acceptance tests for this module:** create/edit/delete in app appears in Google within seconds; create/edit/delete in Google appears in app within one poll cycle; simultaneous edit resolves last-write-wins and logs a conflict; token expiry auto-refreshes; full resync after simulated 410 produces identical state.

-----

## 5. Feature modules

### 5.1 Hub — "My Life" (home page)

- Header: date + greeting. Two top panels: **Today's Actions** (tasks due/overdue today, checkbox complete inline) and **Today's Calendar** (merged events + time blocks, "now" indicator, time-remaining chip on the current item).
- Card grid: My Projects, Key Elements, My Topics, My Goals, My Habits — each with counts, click-through to the entity list.
- **Fleeting parking lot:** horizontal row of sticky-note cards (quick capture input; each sticky is a file in `Fleeting Notes/`); drag a sticky onto "Tasks" to convert it.

### 5.2 Tasks (native, replaces Todoist)

- Full CRUD; fields per schema. Views: Today, Overdue, Upcoming (7d), by Project, by Key Element, Weekly Goals, Completed (log).
- Quick-add with natural-ish parsing: "Send May invoice Mon 9am p1 #CCG" → title/due/priority/project.
- Recurrence via RRULE (use `rrule` package); completing a recurring task spawns the next occurrence.
- Subtasks (parent_task_id), drag to reorder, keyboard-first (n=new, e=edit, x=complete).
- **Weekly Goals:** flag up to ~5 tasks as this week's goals; shown as a pinned group in the planner sidebar with a progress count.

### 5.3 Weekly Planner

- Week grid (Mon–Sun toggleable to work-week), 30-min rows, current-time line, click-drag to create a block, drag edges to resize.
- Right sidebar: **Unscheduled** tasks, **Weekly Goals**, **Overdue** — all draggable onto the grid (drop = schedule = creates time block + Cockpit-calendar event per §4).
- Google events render as distinct cards (calendar color); time blocks render in accent color; both movable (moves propagate per §4).
- "Hide morning" collapse toggle; week navigation; a compact month mini-map.

### 5.4 Entities & notes (the PKM layer)

- Entity types: Person, Organization, Project, Topic, Key Element, Goal, Habit, Document. Each type: list view (sortable, searchable) + detail view.
- Detail view = rendered Markdown body (editable in-place with a CodeMirror Markdown editor) + right metadata panel (frontmatter fields as a form; type-specific templates) + **"What links here"** backlinks + a **Discuss with AI** button (§5.9).
- Wikilink autocomplete in the editor; clicking a wikilink navigates; unresolved links offer "create note".
- Full-text search (SQLite FTS5) across the vault, opened with Cmd/Ctrl-K.
- External-edit safety: chokidar watcher re-indexes changed files; if a file changed on disk while open in the app editor, show a reload banner (no silent overwrite).

### 5.5 Journal

- One file per day (`Journal/YYYY-MM-DD.md`), template with sections (Log, Gratitude, Photos). Calendar-strip navigation; image paste/drag stores into `_attachments/` and embeds.
- Day view also shows that day's completed tasks and workouts (read-only context strip).

### 5.6 Health & Life

- Dashboard of metric tiles (Weight, Body fat, BMI auto-derived, Resting HR, HRV, Sleep, Steps, Mood, Energy): latest value, delta vs 30d, sparkline; click → full history chart + table.
- Quick-entry form and CSV import (column-mapping UI) for bulk history (e.g., Whoop/Coros exports).
- **Labs:** table grouped by analyte with reference ranges, out-of-range highlighting, per-analyte history chart. Manual entry + CSV import.
- Free-form sections as notes: Diagnoses & history, Psychological profile, Patterns (Markdown files under a Health key element).

### 5.7 Workouts

- Import GPX/FIT files (Coros export) via drag-drop: parse to `workouts` row, store file, compute distance/duration/avg HR/avg power, encode route polyline.
- List view (filter by sport) + detail with Leaflet route map and basic charts (pace/HR over time). Manual-entry fallback for gym sessions.

### 5.8 Whiteboards & Knowledge Graph

- Whiteboards: React Flow canvases — sticky notes, text nodes, note-embed nodes (link to vault notes), free connections with **editable edge labels** ("why are these connected?"). Boards listed on a Whiteboards page; persist JSON per board.
- Graph: force-directed graph of `notes_index` + `links`, colored by type, filter by type/folder, click node → open note. Local graph (1–2 hops) embedded on entity detail pages.

### 5.9 Discuss with AI

- Side-panel chat on any note/entity/board: context = current note body + frontmatter + 1-hop linked notes (truncated to a sane token budget). Streams responses from the Anthropic API (`claude-sonnet-4-6` default, model configurable in Settings). Threads persisted per note. An "insert to note" action appends an AI answer under a `## AI notes` heading.

### 5.10 Settings

- Connections (Google auth, calendar toggles, sync status + conflict log), profile/timezone, vault path, AI model + key status, database backup button (copies db + zips vault to `~/CockpitBackups/`).

-----

## 6. Build phases & acceptance criteria

Each phase = one Claude Code session. Test gate before commit.

**Phase 0 — Scaffold.** Next.js + TS + Tailwind + dark theme shell, sidebar nav with all sections (empty pages), SQLite bootstrapped with migration runner, vault folders created with 6–8 realistic seed notes per type and seed tasks/metrics. Write `CLAUDE.md` (stack, conventions, schema pointer, phase checklist). ✅ App boots at :4317, dark shell navigates everywhere.

**Phase 1 — Vault engine.** Frontmatter parser, indexer, FTS5 search, chokidar watcher, wikilink resolution, backlinks API, `rebuild-index` script. ✅ Editing a seed file externally updates search & backlinks without restart.

**Phase 2 — Tasks.** Full module per §5.2. ✅ CRUD, recurrence, weekly goals, quick-add parsing all work; unit tests for RRULE spawning.

**Phase 3 — Planner (local only).** Grid, drag-to-schedule from sidebar, resize/move, time blocks persisted. ✅ Smooth DnD; blocks survive reload.

**Phase 4 — Google Calendar sync.** Module per §4 + Settings/Connections UI + planner rendering of Google events. ✅ All §4 acceptance tests pass against a real account.

**Phase 5 — Entities & notes UI.** Per §5.4 incl. editor, metadata forms, backlinks, search palette. ✅ Create/edit Person & Project end-to-end; files remain Obsidian-readable.

**Phase 6 — Hub + Journal + Fleeting notes.** Per §5.1, §5.5. ✅ Hub reflects live tasks/calendar; sticky→task conversion works.

**Phase 7 — Health & Workouts.** Per §5.6, §5.7 incl. CSV + GPX/FIT import. ✅ Import a real Coros GPX; labs render with ranges.

**Phase 8 — Whiteboards + Graph.** Per §5.8. ✅ Board persists; edge labels editable; graph filters work.

**Phase 9 — AI panel + Settings + polish.** Per §5.9, §5.10; empty states, keyboard shortcuts help, loading states; `npm run cockpit` one-command start; backup button. ✅ AI discussion streams on an entity with linked context.

**Guardrails for Claude Code:** never store secrets in the repo; never write to the vault except through the vault engine; all schema changes via new migrations; keep modules decoupled (planner must work with sync disabled); prefer boring, well-maintained libraries; every phase ends with the app in a runnable state.

-----

## 7. Kickoff prompt (paste into Claude Code, repo containing only SPEC.md)

> Read SPEC.md fully. We are building Life Cockpit exactly as specified, one phase per session. Start with Phase 0: enter plan mode, propose the scaffold plan including exact dependency list and migration-runner approach, wait for my approval, then implement. Create CLAUDE.md as described in §6 Phase 0 and keep it updated at the end of every phase with: decisions made, deviations from spec (with reasons), and the phase checklist status. Do not start Phase 1 until I confirm Phase 0 acceptance criteria pass on my machine.

Then for each later phase: *"Phase N next. Re-read SPEC.md §relevant and CLAUDE.md, plan first, implement, run the acceptance checks."*
