CREATE TABLE IF NOT EXISTS notes_index (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  created TEXT NOT NULL,
  updated TEXT NOT NULL,
  frontmatter_json TEXT
);

CREATE TABLE IF NOT EXISTS links (
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  context TEXT,
  PRIMARY KEY (source_id, target_id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  notes TEXT,
  project_id TEXT,
  key_element_id TEXT,
  due_date TEXT,
  due_time TEXT,
  duration_min INTEGER,
  priority INTEGER DEFAULT 3,
  status TEXT DEFAULT 'open',
  rrule TEXT,
  is_weekly_goal INTEGER DEFAULT 0,
  parent_task_id TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS time_blocks (
  id TEXT PRIMARY KEY,
  task_id TEXT,
  title TEXT NOT NULL,
  start TEXT NOT NULL,
  end TEXT NOT NULL,
  gcal_event_id TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS gcal_calendars (
  google_id TEXT PRIMARY KEY,
  summary TEXT NOT NULL,
  color TEXT,
  sync_enabled INTEGER DEFAULT 0,
  sync_token TEXT,
  channel_id TEXT,
  channel_expiration TEXT
);

CREATE TABLE IF NOT EXISTS gcal_events (
  id TEXT PRIMARY KEY,
  calendar_google_id TEXT NOT NULL,
  google_event_id TEXT NOT NULL,
  etag TEXT,
  title TEXT NOT NULL,
  start TEXT NOT NULL,
  end TEXT NOT NULL,
  all_day INTEGER DEFAULT 0,
  location TEXT,
  description TEXT,
  status TEXT DEFAULT 'confirmed',
  google_updated TEXT,
  local_updated TEXT,
  dirty INTEGER DEFAULT 0,
  deleted INTEGER DEFAULT 0,
  UNIQUE(calendar_google_id, google_event_id)
);

CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY,
  op TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_conflicts (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  local_version TEXT NOT NULL,
  remote_version TEXT NOT NULL,
  resolved_at TEXT,
  resolution TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS health_metrics (
  id TEXT PRIMARY KEY,
  metric TEXT NOT NULL,
  value REAL NOT NULL,
  unit TEXT,
  measured_at TEXT NOT NULL,
  source TEXT,
  note TEXT
);

CREATE TABLE IF NOT EXISTS lab_results (
  id TEXT PRIMARY KEY,
  analyte TEXT NOT NULL,
  value REAL NOT NULL,
  unit TEXT,
  ref_low REAL,
  ref_high REAL,
  drawn_at TEXT NOT NULL,
  source TEXT
);

CREATE TABLE IF NOT EXISTS workouts (
  id TEXT PRIMARY KEY,
  sport TEXT NOT NULL,
  start TEXT NOT NULL,
  duration_s INTEGER,
  distance_m REAL,
  avg_hr REAL,
  avg_power REAL,
  file_path TEXT,
  polyline TEXT,
  source TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS whiteboards (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS whiteboard_note_links (
  whiteboard_id TEXT NOT NULL,
  note_id TEXT NOT NULL,
  PRIMARY KEY (whiteboard_id, note_id)
);

CREATE TABLE IF NOT EXISTS ai_threads (
  id TEXT PRIMARY KEY,
  subject_note_id TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);
