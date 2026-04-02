import Database from 'better-sqlite3';

export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS meetings (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      is_open_for_submissions INTEGER NOT NULL DEFAULT 0,
      opened_at TEXT,
      closed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      meeting_id TEXT NOT NULL,
      avatar_id TEXT NOT NULL,
      text TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Submitted',
      ip_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      selected_at TEXT,
      answered_at TEXT,
      FOREIGN KEY (meeting_id) REFERENCES meetings(id)
    );

    CREATE INDEX IF NOT EXISTS idx_questions_meeting_status
      ON questions(meeting_id, status);

    CREATE INDEX IF NOT EXISTS idx_questions_ip_hash_created
      ON questions(ip_hash, created_at);

    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      must_change_password INTEGER NOT NULL DEFAULT 1,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_admins_username
      ON admins(username);
  `);
}
