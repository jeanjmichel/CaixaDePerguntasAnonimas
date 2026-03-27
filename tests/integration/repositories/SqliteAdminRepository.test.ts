import Database from 'better-sqlite3';
import { runMigrations } from '@/infrastructure/database/migrations';
import { SqliteAdminRepository } from '@/infrastructure/repositories/SqliteAdminRepository';
import { createAdmin } from '../../helpers/factories';

describe('SqliteAdminRepository', () => {
  let db: Database.Database;
  let repo: SqliteAdminRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    runMigrations(db);
    repo = new SqliteAdminRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('create and findById', () => {
    it('should create an admin and retrieve by id', async () => {
      const admin = createAdmin({ id: 'a1', username: 'admin1' });
      await repo.create(admin);

      const found = await repo.findById('a1');
      expect(found).not.toBeNull();
      expect(found!.id).toBe('a1');
      expect(found!.username).toBe('admin1');
      expect(found!.isActive).toBe(true);
    });

    it('should return null for non-existent id', async () => {
      const found = await repo.findById('non-existent');
      expect(found).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should find admin by username', async () => {
      const admin = createAdmin({ id: 'a1', username: 'admin1' });
      await repo.create(admin);

      const found = await repo.findByUsername('admin1');
      expect(found).not.toBeNull();
      expect(found!.id).toBe('a1');
    });

    it('should return null for non-existent username', async () => {
      const found = await repo.findByUsername('nobody');
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all admins ordered by createdAt', async () => {
      const a1 = createAdmin({
        id: 'a1',
        username: 'first',
        createdAt: new Date('2026-01-01'),
      });
      const a2 = createAdmin({
        id: 'a2',
        username: 'second',
        createdAt: new Date('2026-06-01'),
      });

      await repo.create(a1);
      await repo.create(a2);

      const all = await repo.findAll();
      expect(all).toHaveLength(2);
      expect(all[0].username).toBe('first');
      expect(all[1].username).toBe('second');
    });

    it('should return empty array when no admins exist', async () => {
      const all = await repo.findAll();
      expect(all).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('should update admin properties', async () => {
      const admin = createAdmin({ id: 'a1', username: 'admin1', mustChangePassword: true });
      await repo.create(admin);

      const updated = admin.changePassword('new-hash');
      await repo.update(updated);

      const found = await repo.findById('a1');
      expect(found!.passwordHash).toBe('new-hash');
      expect(found!.mustChangePassword).toBe(false);
    });

    it('should toggle active status', async () => {
      const admin = createAdmin({ id: 'a1', username: 'admin1', isActive: true });
      await repo.create(admin);

      const deactivated = admin.toggleActive(false);
      await repo.update(deactivated);

      const found = await repo.findById('a1');
      expect(found!.isActive).toBe(false);
    });
  });

  describe('unique constraint', () => {
    it('should reject duplicate usernames', async () => {
      const a1 = createAdmin({ id: 'a1', username: 'same' });
      const a2 = createAdmin({ id: 'a2', username: 'same' });

      await repo.create(a1);

      await expect(repo.create(a2)).rejects.toThrow();
    });
  });
});
