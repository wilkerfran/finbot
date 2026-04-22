import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.resolve('finbot.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS pending_confirmations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transaction_cache (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    synced INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export function savePendingConfirmation(phone, data) {
  const stmt = db.prepare(
    'INSERT OR REPLACE INTO pending_confirmations (phone, data) VALUES (?, ?)'
  );
  stmt.run(phone, JSON.stringify(data));
}

export function getPendingConfirmation(phone) {
  const stmt = db.prepare(
    'SELECT data FROM pending_confirmations WHERE phone = ? ORDER BY created_at DESC LIMIT 1'
  );
  const row = stmt.get(phone);
  return row ? JSON.parse(row.data) : null;
}

export function clearPendingConfirmation(phone) {
  const stmt = db.prepare(
    'DELETE FROM pending_confirmations WHERE phone = ?'
  );
  stmt.run(phone);
}

export function getSetting(key) {
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const row = stmt.get(key);
  return row ? row.value : null;
}

export function setSetting(key, value) {
  const stmt = db.prepare(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)'
  );
  stmt.run(key, String(value));
}

export default db;