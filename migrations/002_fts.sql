CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
  id UNINDEXED,
  title,
  body,
  content='',
  tokenize='porter unicode61'
);
