import { getDb } from './client'

export function initDb() {
  const db = getDb()

  db.exec(`
    CREATE TABLE IF NOT EXISTS channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      model_id TEXT NOT NULL,
      api_key TEXT NOT NULL,
      base_url TEXT NOT NULL,
      billing_rate REAL NOT NULL DEFAULT 1.0,
      status TEXT NOT NULL DEFAULT 'active',
      health TEXT NOT NULL DEFAULT 'unknown',
      last_check_at INTEGER,
      error_count INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS relay_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      credits REAL NOT NULL DEFAULT 0,
      credits_limit REAL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at INTEGER NOT NULL,
      last_used_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS call_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      relay_key_id INTEGER REFERENCES relay_keys(id),
      channel_id INTEGER REFERENCES channels(id),
      model TEXT NOT NULL,
      prompt_tokens INTEGER NOT NULL DEFAULT 0,
      completion_tokens INTEGER NOT NULL DEFAULT 0,
      credits_used REAL NOT NULL DEFAULT 0,
      latency_ms INTEGER,
      status TEXT NOT NULL,
      error_msg TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_call_logs_created_at ON call_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_call_logs_relay_key_id ON call_logs(relay_key_id);
    CREATE INDEX IF NOT EXISTS idx_relay_keys_key ON relay_keys(key);
  `)

  console.log('Database initialized')
}
