import Database from 'better-sqlite3';
import { runMigrations } from '@/infrastructure/database/migrations';
import { SqliteMeetingRepository } from '@/infrastructure/repositories/SqliteMeetingRepository';
import { UuidGenerator } from '@/infrastructure/id/UuidGenerator';
import { CreateMeetingUseCase } from '@/application/use-cases/meetings/CreateMeeting';
import { UpdateMeetingUseCase } from '@/application/use-cases/meetings/UpdateMeeting';
import { ListMeetingsUseCase } from '@/application/use-cases/meetings/ListMeetings';
import { OpenMeetingForSubmissionsUseCase } from '@/application/use-cases/meetings/OpenMeetingForSubmissions';
import { CloseMeetingForSubmissionsUseCase } from '@/application/use-cases/meetings/CloseMeetingForSubmissions';
import { ApplicationError } from '@/application/errors/ApplicationError';

describe('Meeting Use Cases — Integration', () => {
  let db: Database.Database;
  let meetingRepo: SqliteMeetingRepository;
  let createMeeting: CreateMeetingUseCase;
  let updateMeeting: UpdateMeetingUseCase;
  let listMeetings: ListMeetingsUseCase;
  let openMeeting: OpenMeetingForSubmissionsUseCase;
  let closeMeeting: CloseMeetingForSubmissionsUseCase;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    runMigrations(db);

    meetingRepo = new SqliteMeetingRepository(db);
    const idGenerator = new UuidGenerator();

    createMeeting = new CreateMeetingUseCase(meetingRepo, idGenerator);
    updateMeeting = new UpdateMeetingUseCase(meetingRepo);
    listMeetings = new ListMeetingsUseCase(meetingRepo);
    openMeeting = new OpenMeetingForSubmissionsUseCase(meetingRepo);
    closeMeeting = new CloseMeetingForSubmissionsUseCase(meetingRepo);
  });

  afterEach(() => {
    db.close();
  });

  describe('CRUD completo', () => {
    it('should create, list, update, and retrieve meetings', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();

      const created = await createMeeting.execute({
        title: 'Sprint Planning',
        scheduledAt: futureDate,
      });

      expect(created.id).toBeDefined();
      expect(created.title).toBe('Sprint Planning');
      expect(created.isOpenForSubmissions).toBe(false);

      const all = await listMeetings.execute();
      expect(all).toHaveLength(1);
      expect(all[0].id).toBe(created.id);

      const newDate = new Date(Date.now() + 172800000).toISOString();
      const updated = await updateMeeting.execute(created.id, {
        title: 'Sprint Planning v2',
        scheduledAt: newDate,
      });

      expect(updated.title).toBe('Sprint Planning v2');

      const all2 = await listMeetings.execute();
      expect(all2).toHaveLength(1);
      expect(all2[0].title).toBe('Sprint Planning v2');
    });

    it('should throw MEETING_NOT_FOUND when updating nonexistent meeting', async () => {
      await expect(
        updateMeeting.execute('nonexistent', {
          title: 'Title',
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        }),
      ).rejects.toMatchObject({ code: 'MEETING_NOT_FOUND' });
    });
  });

  describe('Abrir/fechar coleta', () => {
    it('should open a meeting for submissions', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const created = await createMeeting.execute({ title: 'Retro', scheduledAt: futureDate });

      const opened = await openMeeting.execute(created.id);

      expect(opened.isOpenForSubmissions).toBe(true);
      expect(opened.openedAt).toBeDefined();
    });

    it('should close a meeting for submissions', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const created = await createMeeting.execute({ title: 'Demo', scheduledAt: futureDate });
      await openMeeting.execute(created.id);

      const closed = await closeMeeting.execute(created.id);

      expect(closed.isOpenForSubmissions).toBe(false);
      expect(closed.closedAt).toBeDefined();
    });

    it('should close idempotently (already closed)', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const created = await createMeeting.execute({ title: 'Standup', scheduledAt: futureDate });

      const result = await closeMeeting.execute(created.id);

      expect(result.isOpenForSubmissions).toBe(false);
    });
  });

  describe('Apenas uma reunião aberta por vez', () => {
    it('should close the previously open meeting when opening another', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const meeting1 = await createMeeting.execute({ title: 'Meeting 1', scheduledAt: futureDate });
      const meeting2 = await createMeeting.execute({ title: 'Meeting 2', scheduledAt: futureDate });

      await openMeeting.execute(meeting1.id);
      await openMeeting.execute(meeting2.id);

      const all = await listMeetings.execute();
      const openMeetings = all.filter((m) => m.isOpenForSubmissions);

      expect(openMeetings).toHaveLength(1);
      expect(openMeetings[0].id).toBe(meeting2.id);
    });

    it('should only have one open meeting after opening multiple sequentially', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const m1 = await createMeeting.execute({ title: 'M1', scheduledAt: futureDate });
      const m2 = await createMeeting.execute({ title: 'M2', scheduledAt: futureDate });
      const m3 = await createMeeting.execute({ title: 'M3', scheduledAt: futureDate });

      await openMeeting.execute(m1.id);
      await openMeeting.execute(m2.id);
      await openMeeting.execute(m3.id);

      const all = await listMeetings.execute();
      const openMeetings = all.filter((m) => m.isOpenForSubmissions);

      expect(openMeetings).toHaveLength(1);
      expect(openMeetings[0].id).toBe(m3.id);
    });
  });
});
