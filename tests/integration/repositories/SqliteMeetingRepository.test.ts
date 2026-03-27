import Database from 'better-sqlite3';
import { runMigrations } from '@/infrastructure/database/migrations';
import { SqliteMeetingRepository } from '@/infrastructure/repositories/SqliteMeetingRepository';
import { createMeeting, createOpenMeeting } from '../../helpers/factories';

describe('SqliteMeetingRepository', () => {
  let db: Database.Database;
  let repo: SqliteMeetingRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    runMigrations(db);
    repo = new SqliteMeetingRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('create and findById', () => {
    it('should create a meeting and retrieve it by id', async () => {
      const meeting = createMeeting({ id: 'm1', title: 'Townhall Jan' });
      await repo.create(meeting);

      const found = await repo.findById('m1');
      expect(found).not.toBeNull();
      expect(found!.id).toBe('m1');
      expect(found!.title).toBe('Townhall Jan');
      expect(found!.isOpenForSubmissions).toBe(false);
    });

    it('should return null for non-existent id', async () => {
      const found = await repo.findById('non-existent');
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all meetings ordered by scheduledAt DESC', async () => {
      const m1 = createMeeting({
        id: 'm1',
        title: 'First',
        scheduledAt: new Date('2026-01-01'),
      });
      const m2 = createMeeting({
        id: 'm2',
        title: 'Second',
        scheduledAt: new Date('2026-06-01'),
      });

      await repo.create(m1);
      await repo.create(m2);

      const all = await repo.findAll();
      expect(all).toHaveLength(2);
      expect(all[0].id).toBe('m2');
      expect(all[1].id).toBe('m1');
    });

    it('should return empty array when no meetings exist', async () => {
      const all = await repo.findAll();
      expect(all).toHaveLength(0);
    });
  });

  describe('findOpenForSubmissions', () => {
    it('should return the open meeting', async () => {
      const meeting = createOpenMeeting({ id: 'm1', title: 'Open Townhall' });
      await repo.create(meeting);

      const found = await repo.findOpenForSubmissions();
      expect(found).not.toBeNull();
      expect(found!.id).toBe('m1');
      expect(found!.isOpenForSubmissions).toBe(true);
    });

    it('should return null when no meeting is open', async () => {
      const meeting = createMeeting({ id: 'm1' });
      await repo.create(meeting);

      const found = await repo.findOpenForSubmissions();
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update meeting properties', async () => {
      const meeting = createMeeting({ id: 'm1', title: 'Original' });
      await repo.create(meeting);

      const updated = meeting.updateDetails('Updated Title', new Date('2026-12-01'));
      await repo.update(updated);

      const found = await repo.findById('m1');
      expect(found!.title).toBe('Updated Title');
    });

    it('should update open/close state', async () => {
      const meeting = createMeeting({ id: 'm1' });
      await repo.create(meeting);

      const opened = meeting.open();
      await repo.update(opened);

      let found = await repo.findById('m1');
      expect(found!.isOpenForSubmissions).toBe(true);
      expect(found!.openedAt).not.toBeNull();

      const closed = opened.close();
      await repo.update(closed);

      found = await repo.findById('m1');
      expect(found!.isOpenForSubmissions).toBe(false);
      expect(found!.closedAt).not.toBeNull();
    });
  });

  describe('closeAllOpen', () => {
    it('should close all open meetings', async () => {
      const m1 = createOpenMeeting({ id: 'm1' });
      const m2 = createOpenMeeting({ id: 'm2' });
      const m3 = createMeeting({ id: 'm3' });

      await repo.create(m1);
      await repo.create(m2);
      await repo.create(m3);

      await repo.closeAllOpen();

      const found1 = await repo.findById('m1');
      const found2 = await repo.findById('m2');
      const found3 = await repo.findById('m3');

      expect(found1!.isOpenForSubmissions).toBe(false);
      expect(found1!.closedAt).not.toBeNull();
      expect(found2!.isOpenForSubmissions).toBe(false);
      expect(found2!.closedAt).not.toBeNull();
      expect(found3!.isOpenForSubmissions).toBe(false);
    });

    it('should be a no-op when no meetings are open', async () => {
      const meeting = createMeeting({ id: 'm1' });
      await repo.create(meeting);

      await repo.closeAllOpen();

      const found = await repo.findById('m1');
      expect(found!.isOpenForSubmissions).toBe(false);
    });
  });
});
