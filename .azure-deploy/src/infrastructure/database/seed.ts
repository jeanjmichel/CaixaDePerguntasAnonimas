/**
 * DEV-ONLY: This seed function is kept for local development convenience (npm run seed).
 * In production, the ApplicationBootstrapper (via instrumentation.ts) handles
 * initial admin creation automatically at server startup.
 */
import Database from 'better-sqlite3';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export async function runSeed(db: Database.Database): Promise<void> {
  const username = process.env.SEED_ADMIN_USERNAME || 'admin';
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!password) {
    console.warn('[Seed] SEED_ADMIN_PASSWORD is not set. Skipping seed.');
    return;
  }

  const existing = db
    .prepare('SELECT id FROM admins WHERE username = ?')
    .get(username);

  if (existing) {
    console.log(`[Seed] Admin "${username}" already exists. Skipping.`);
    return;
  }

  const id = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO admins (id, username, password_hash, must_change_password, is_active, created_at, updated_at)
     VALUES (?, ?, ?, 1, 1, ?, ?)`
  ).run(id, username, passwordHash, now, now);

  console.log(`[Seed] Admin "${username}" created with must_change_password=true.`);
}
