import Database from 'better-sqlite3';
import { ApplicationBootstrapper } from '@/application/bootstrap/ApplicationBootstrapper';
import { SqliteMigrationRunner } from '@/infrastructure/bootstrap/SqliteMigrationRunner';
import { EnvironmentBootstrapConfigProvider } from '@/infrastructure/bootstrap/EnvironmentBootstrapConfigProvider';
import { SqliteAdminRepository } from '@/infrastructure/repositories/SqliteAdminRepository';
import { BcryptPasswordHasher } from '@/infrastructure/security/BcryptPasswordHasher';
import { UuidGenerator } from '@/infrastructure/id/UuidGenerator';

describe('Bootstrap Application — Integration', () => {
  let db: Database.Database;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  const originalEnv = { ...process.env };

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    process.env = { ...originalEnv };
    db.close();
  });

  function createBootstrapper(): ApplicationBootstrapper {
    return new ApplicationBootstrapper(
      new SqliteMigrationRunner(db),
      new SqliteAdminRepository(db),
      new BcryptPasswordHasher(),
      new UuidGenerator(),
      new EnvironmentBootstrapConfigProvider(),
    );
  }

  it('should create tables and seed admin from scratch', async () => {
    process.env.SEED_ADMIN_USERNAME = 'testadmin';
    process.env.SEED_ADMIN_PASSWORD = 'testpass123';

    const bootstrapper = createBootstrapper();
    await bootstrapper.execute();

    const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get('testadmin') as Record<string, unknown>;
    expect(admin).toBeDefined();
    expect(admin.username).toBe('testadmin');
    expect(admin.is_active).toBe(1);
    expect(admin.must_change_password).toBe(1);

    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('meetings', 'questions', 'admins') ORDER BY name"
    ).all() as { name: string }[];
    expect(tables.map(t => t.name)).toEqual(['admins', 'meetings', 'questions']);
  });

  it('should be idempotent — running twice creates no duplicates', async () => {
    process.env.SEED_ADMIN_USERNAME = 'testadmin';
    process.env.SEED_ADMIN_PASSWORD = 'testpass123';

    const bootstrapper1 = createBootstrapper();
    await bootstrapper1.execute();

    const bootstrapper2 = createBootstrapper();
    await bootstrapper2.execute();

    const admins = db.prepare('SELECT * FROM admins WHERE username = ?').all('testadmin');
    expect(admins).toHaveLength(1);
  });

  it('should not overwrite existing admin password on re-run', async () => {
    process.env.SEED_ADMIN_USERNAME = 'testadmin';
    process.env.SEED_ADMIN_PASSWORD = 'testpass123';

    const bootstrapper1 = createBootstrapper();
    await bootstrapper1.execute();

    const adminBefore = db.prepare('SELECT password_hash FROM admins WHERE username = ?').get('testadmin') as { password_hash: string };

    process.env.SEED_ADMIN_PASSWORD = 'different-password';

    const bootstrapper2 = createBootstrapper();
    await bootstrapper2.execute();

    const adminAfter = db.prepare('SELECT password_hash FROM admins WHERE username = ?').get('testadmin') as { password_hash: string };
    expect(adminAfter.password_hash).toBe(adminBefore.password_hash);
  });

  it('should skip admin creation when SEED_ADMIN_PASSWORD is missing', async () => {
    delete process.env.SEED_ADMIN_PASSWORD;
    process.env.SEED_ADMIN_USERNAME = 'testadmin';

    const bootstrapper = createBootstrapper();
    await bootstrapper.execute();

    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name = 'admins'"
    ).all();
    expect(tables).toHaveLength(1);

    const admins = db.prepare('SELECT * FROM admins').all();
    expect(admins).toHaveLength(0);

    const messages = consoleSpy.mock.calls.map(call => call[0]);
    expect(messages).toContain('[Bootstrap] Skipped: missing seed password');
  });

  it('should skip admin creation when SEED_ADMIN_PASSWORD is empty', async () => {
    process.env.SEED_ADMIN_USERNAME = 'testadmin';
    process.env.SEED_ADMIN_PASSWORD = '   ';

    const bootstrapper = createBootstrapper();
    await bootstrapper.execute();

    const admins = db.prepare('SELECT * FROM admins').all();
    expect(admins).toHaveLength(0);

    const messages = consoleSpy.mock.calls.map(call => call[0]);
    expect(messages).toContain('[Bootstrap] Skipped: missing seed password');
  });

  it('should fall back to username "admin" when SEED_ADMIN_USERNAME is unset', async () => {
    delete process.env.SEED_ADMIN_USERNAME;
    process.env.SEED_ADMIN_PASSWORD = 'testpass123';

    const bootstrapper = createBootstrapper();
    await bootstrapper.execute();

    const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get('admin') as Record<string, unknown>;
    expect(admin).toBeDefined();
    expect(admin.username).toBe('admin');
  });
});

describe('bootstrapApplication — single execution guard', () => {
  it('should execute bootstrap only once even when called concurrently', async () => {
    const db = new Database(':memory:');
    db.pragma('foreign_keys = ON');

    process.env.SEED_ADMIN_USERNAME = 'guardtest';
    process.env.SEED_ADMIN_PASSWORD = 'testpass123';

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    let guardPromise: Promise<void> | null = null;

    function bootstrapWithGuard(): Promise<void> {
      if (guardPromise) return guardPromise;

      guardPromise = (async () => {
        const bootstrapper = new ApplicationBootstrapper(
          new SqliteMigrationRunner(db),
          new SqliteAdminRepository(db),
          new BcryptPasswordHasher(),
          new UuidGenerator(),
          new EnvironmentBootstrapConfigProvider(),
        );
        await bootstrapper.execute();
      })();

      return guardPromise;
    }

    const promise1 = bootstrapWithGuard();
    const promise2 = bootstrapWithGuard();

    // Same promise reference — guard returns the stored promise
    expect(promise1).toBe(promise2);

    await promise1;
    await promise2;

    // Bootstrap started exactly once
    const startedCount = consoleSpy.mock.calls.filter(c => c[0] === '[Bootstrap] Started').length;
    expect(startedCount).toBe(1);

    // Only one admin created
    const admins = db.prepare('SELECT * FROM admins WHERE username = ?').all('guardtest');
    expect(admins).toHaveLength(1);

    consoleSpy.mockRestore();
    db.close();
  });
});

describe('ensureBootstrap — lazy bootstrap guard', () => {
  it('should await bootstrap completion', async () => {
    const db = new Database(':memory:');
    db.pragma('foreign_keys = ON');

    process.env.SEED_ADMIN_USERNAME = 'ensuretest';
    process.env.SEED_ADMIN_PASSWORD = 'testpass123';

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    let guardPromise: Promise<void> | null = null;

    function bootstrap(): Promise<void> {
      if (guardPromise) return guardPromise;
      guardPromise = (async () => {
        const bootstrapper = new ApplicationBootstrapper(
          new SqliteMigrationRunner(db),
          new SqliteAdminRepository(db),
          new BcryptPasswordHasher(),
          new UuidGenerator(),
          new EnvironmentBootstrapConfigProvider(),
        );
        await bootstrapper.execute();
      })();
      return guardPromise;
    }

    async function ensureBootstrap(): Promise<void> {
      if (!guardPromise) {
        bootstrap();
      }
      await guardPromise;
    }

    await ensureBootstrap();

    const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get('ensuretest') as Record<string, unknown>;
    expect(admin).toBeDefined();
    expect(admin.username).toBe('ensuretest');

    const messages = consoleSpy.mock.calls.map(call => call[0]);
    expect(messages).toContain('[Bootstrap] Completed');

    consoleSpy.mockRestore();
    db.close();
  });

  it('should trigger bootstrap if not yet started', async () => {
    const db = new Database(':memory:');
    db.pragma('foreign_keys = ON');

    process.env.SEED_ADMIN_USERNAME = 'lazytest';
    process.env.SEED_ADMIN_PASSWORD = 'testpass123';

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    let guardPromise: Promise<void> | null = null;

    function bootstrap(): Promise<void> {
      if (guardPromise) return guardPromise;
      guardPromise = (async () => {
        const bootstrapper = new ApplicationBootstrapper(
          new SqliteMigrationRunner(db),
          new SqliteAdminRepository(db),
          new BcryptPasswordHasher(),
          new UuidGenerator(),
          new EnvironmentBootstrapConfigProvider(),
        );
        await bootstrapper.execute();
      })();
      return guardPromise;
    }

    async function ensureBootstrap(): Promise<void> {
      if (!guardPromise) {
        bootstrap();
      }
      await guardPromise;
    }

    // Do NOT call bootstrap() first — ensureBootstrap triggers it lazily
    await ensureBootstrap();

    const startedCount = consoleSpy.mock.calls.filter(c => c[0] === '[Bootstrap] Started').length;
    expect(startedCount).toBe(1);

    const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get('lazytest') as Record<string, unknown>;
    expect(admin).toBeDefined();

    consoleSpy.mockRestore();
    db.close();
  });

  it('should be safe to call multiple times', async () => {
    const db = new Database(':memory:');
    db.pragma('foreign_keys = ON');

    process.env.SEED_ADMIN_USERNAME = 'multitest';
    process.env.SEED_ADMIN_PASSWORD = 'testpass123';

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    let guardPromise: Promise<void> | null = null;

    function bootstrap(): Promise<void> {
      if (guardPromise) return guardPromise;
      guardPromise = (async () => {
        const bootstrapper = new ApplicationBootstrapper(
          new SqliteMigrationRunner(db),
          new SqliteAdminRepository(db),
          new BcryptPasswordHasher(),
          new UuidGenerator(),
          new EnvironmentBootstrapConfigProvider(),
        );
        await bootstrapper.execute();
      })();
      return guardPromise;
    }

    async function ensureBootstrap(): Promise<void> {
      if (!guardPromise) {
        bootstrap();
      }
      await guardPromise;
    }

    await ensureBootstrap();
    await ensureBootstrap();
    await ensureBootstrap();

    const startedCount = consoleSpy.mock.calls.filter(c => c[0] === '[Bootstrap] Started').length;
    expect(startedCount).toBe(1);

    const admins = db.prepare('SELECT * FROM admins WHERE username = ?').all('multitest');
    expect(admins).toHaveLength(1);

    consoleSpy.mockRestore();
    db.close();
  });
});
