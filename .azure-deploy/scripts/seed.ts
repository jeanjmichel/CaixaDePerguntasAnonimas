/**
 * DEV-ONLY: Standalone seed script for local development and database reset.
 * In production, the ApplicationBootstrapper (via instrumentation.ts) handles
 * migrations and initial admin creation automatically at server startup.
 *
 * Usage: npm run seed
 */
import path from 'path';
import fs from 'fs';
import { createDatabaseFromPath } from '../src/infrastructure/database/connection';
import { runMigrations } from '../src/infrastructure/database/migrations';
import { runSeed } from '../src/infrastructure/database/seed';

function loadEnvFile(): void {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.substring(0, eqIndex).trim();
    const value = trimmed.substring(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function main(): Promise<void> {
  loadEnvFile();

  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'caixa.db');

  console.log(`[Seed] Using database at: ${dbPath}`);

  const db = createDatabaseFromPath(dbPath);

  try {
    runMigrations(db);
    console.log('[Seed] Migrations executed successfully.');

    await runSeed(db);
    console.log('[Seed] Seed completed.');
  } finally {
    db.close();
  }
}

main().catch((err) => {
  console.error('[Seed] Error:', err);
  process.exit(1);
});
