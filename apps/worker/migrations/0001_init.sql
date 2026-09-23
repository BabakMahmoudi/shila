-- Shila v1 schema. Idempotent so it is safe to re-apply.
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  locale TEXT DEFAULT 'fa',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'IRT',
  category TEXT,
  counterparty TEXT,
  description TEXT,
  source TEXT NOT NULL DEFAULT 'text',
  raw_text TEXT,
  occurred_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_time
  ON transactions(user_id, occurred_at);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_session
  ON messages(user_id, session_id, created_at);

CREATE TABLE IF NOT EXISTS context (
  user_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, key)
);

-- Seed the dev user so the v1 slice runs without auth.
INSERT OR IGNORE INTO users (id, email, display_name, locale, created_at)
VALUES ('dev-user', 'dev@shila.local', 'Dev User', 'fa', 0);
