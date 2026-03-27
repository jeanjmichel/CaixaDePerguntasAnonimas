import Database from 'better-sqlite3';
import { runMigrations } from '@/infrastructure/database/migrations';
import { SqliteQuestionRepository } from '@/infrastructure/repositories/SqliteQuestionRepository';
import { SqliteMeetingRepository } from '@/infrastructure/repositories/SqliteMeetingRepository';
import { QuestionStatus } from '@/domain/enums/QuestionStatus';
import { createQuestion, createOpenMeeting } from '../../helpers/factories';

describe('SqliteQuestionRepository', () => {
  let db: Database.Database;
  let questionRepo: SqliteQuestionRepository;
  let meetingRepo: SqliteMeetingRepository;
  const meetingId = 'm1';

  beforeEach(async () => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    runMigrations(db);
    questionRepo = new SqliteQuestionRepository(db);
    meetingRepo = new SqliteMeetingRepository(db);

    const meeting = createOpenMeeting({ id: meetingId });
    await meetingRepo.create(meeting);
  });

  afterEach(() => {
    db.close();
  });

  describe('create and findById', () => {
    it('should create a question and retrieve it by id', async () => {
      const question = createQuestion({ id: 'q1', meetingId, text: 'What is the plan?' });
      await questionRepo.create(question, 'ip-hash-1');

      const found = await questionRepo.findById('q1');
      expect(found).not.toBeNull();
      expect(found!.id).toBe('q1');
      expect(found!.text).toBe('What is the plan?');
      expect(found!.status).toBe(QuestionStatus.Submitted);
      expect(found!.avatarId).toBe('CAPIVARA');
    });

    it('should return null for non-existent id', async () => {
      const found = await questionRepo.findById('non-existent');
      expect(found).toBeNull();
    });
  });

  describe('findByMeetingAndStatus', () => {
    it('should return questions filtered by meeting and status', async () => {
      const q1 = createQuestion({ id: 'q1', meetingId, status: QuestionStatus.Submitted });
      const q2 = createQuestion({ id: 'q2', meetingId, status: QuestionStatus.Selected, selectedAt: new Date() });
      const q3 = createQuestion({ id: 'q3', meetingId, status: QuestionStatus.Submitted });

      await questionRepo.create(q1, 'hash1');
      await questionRepo.create(q2, 'hash2');
      await questionRepo.create(q3, 'hash3');

      const submitted = await questionRepo.findByMeetingAndStatus(meetingId, QuestionStatus.Submitted);
      expect(submitted).toHaveLength(2);

      const selected = await questionRepo.findByMeetingAndStatus(meetingId, QuestionStatus.Selected);
      expect(selected).toHaveLength(1);
      expect(selected[0].id).toBe('q2');
    });

    it('should order by createdAt DESC by default', async () => {
      const q1 = createQuestion({
        id: 'q1',
        meetingId,
        createdAt: new Date('2026-01-01T10:00:00Z'),
      });
      const q2 = createQuestion({
        id: 'q2',
        meetingId,
        createdAt: new Date('2026-01-01T12:00:00Z'),
      });

      await questionRepo.create(q1, 'hash1');
      await questionRepo.create(q2, 'hash2');

      const results = await questionRepo.findByMeetingAndStatus(meetingId, QuestionStatus.Submitted);
      expect(results[0].id).toBe('q2');
      expect(results[1].id).toBe('q1');
    });

    it('should order by selectedAt ASC when specified', async () => {
      const q1 = createQuestion({
        id: 'q1',
        meetingId,
        status: QuestionStatus.Selected,
        selectedAt: new Date('2026-01-01T12:00:00Z'),
      });
      const q2 = createQuestion({
        id: 'q2',
        meetingId,
        status: QuestionStatus.Selected,
        selectedAt: new Date('2026-01-01T10:00:00Z'),
      });

      await questionRepo.create(q1, 'hash1');
      await questionRepo.create(q2, 'hash2');

      const results = await questionRepo.findByMeetingAndStatus(
        meetingId,
        QuestionStatus.Selected,
        { field: 'selected_at', direction: 'ASC' }
      );
      expect(results[0].id).toBe('q2');
      expect(results[1].id).toBe('q1');
    });

    it('should return empty array when no questions match', async () => {
      const results = await questionRepo.findByMeetingAndStatus(meetingId, QuestionStatus.Answered);
      expect(results).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('should update status and timestamps', async () => {
      const question = createQuestion({ id: 'q1', meetingId });
      await questionRepo.create(question, 'hash1');

      const selected = question.transitionTo(QuestionStatus.Selected);
      await questionRepo.update(selected);

      const found = await questionRepo.findById('q1');
      expect(found!.status).toBe(QuestionStatus.Selected);
      expect(found!.selectedAt).not.toBeNull();
    });

    it('should persist answeredAt when transitioning to Answered', async () => {
      const question = createQuestion({
        id: 'q1',
        meetingId,
        status: QuestionStatus.Selected,
        selectedAt: new Date(),
      });
      await questionRepo.create(question, 'hash1');

      const answered = question.transitionTo(QuestionStatus.Answered);
      await questionRepo.update(answered);

      const found = await questionRepo.findById('q1');
      expect(found!.status).toBe(QuestionStatus.Answered);
      expect(found!.answeredAt).not.toBeNull();
    });
  });

  describe('countRecentByIpHash', () => {
    it('should count questions within the time window', async () => {
      const q1 = createQuestion({ id: 'q1', meetingId });
      const q2 = createQuestion({ id: 'q2', meetingId });

      await questionRepo.create(q1, 'same-hash');
      await questionRepo.create(q2, 'same-hash');

      const count = await questionRepo.countRecentByIpHash('same-hash', 60000);
      expect(count).toBe(2);
    });

    it('should not count questions from different IP hashes', async () => {
      const q1 = createQuestion({ id: 'q1', meetingId });
      const q2 = createQuestion({ id: 'q2', meetingId });

      await questionRepo.create(q1, 'hash-a');
      await questionRepo.create(q2, 'hash-b');

      const count = await questionRepo.countRecentByIpHash('hash-a', 60000);
      expect(count).toBe(1);
    });

    it('should return 0 when no questions match', async () => {
      const count = await questionRepo.countRecentByIpHash('no-hash', 60000);
      expect(count).toBe(0);
    });
  });
});
