import Database from 'better-sqlite3';
import { runMigrations } from '@/infrastructure/database/migrations';
import { SqliteMeetingRepository } from '@/infrastructure/repositories/SqliteMeetingRepository';
import { SqliteQuestionRepository } from '@/infrastructure/repositories/SqliteQuestionRepository';
import { InMemoryRateLimiter } from '@/infrastructure/security/InMemoryRateLimiter';
import { XssSanitizer } from '@/infrastructure/security/XssSanitizer';
import { UuidGenerator } from '@/infrastructure/id/UuidGenerator';
import { SubmitQuestionUseCase } from '@/application/use-cases/public/SubmitQuestion';
import { GetOpenMeetingUseCase } from '@/application/use-cases/public/GetOpenMeeting';
import { ApplicationError } from '@/application/errors/ApplicationError';
import { QuestionStatus } from '@/domain/enums/QuestionStatus';
import { createOpenMeeting, createMeeting } from '../../helpers/factories';

describe('Public Use Cases — Integration', () => {
  let db: Database.Database;
  let meetingRepo: SqliteMeetingRepository;
  let questionRepo: SqliteQuestionRepository;
  let submitQuestion: SubmitQuestionUseCase;
  let getOpenMeeting: GetOpenMeetingUseCase;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    runMigrations(db);

    meetingRepo = new SqliteMeetingRepository(db);
    questionRepo = new SqliteQuestionRepository(db);
    const rateLimiter = new InMemoryRateLimiter(60000, 5);
    const sanitizer = new XssSanitizer();
    const idGenerator = new UuidGenerator();

    submitQuestion = new SubmitQuestionUseCase(meetingRepo, questionRepo, rateLimiter, sanitizer, idGenerator);
    getOpenMeeting = new GetOpenMeetingUseCase(meetingRepo);
  });

  afterEach(() => {
    db.close();
  });

  describe('SubmitQuestion — full stack', () => {
    it('should create a question in the database', async () => {
      const meeting = createOpenMeeting({ id: 'meeting-1' });
      await meetingRepo.create(meeting);

      const result = await submitQuestion.execute(
        { meetingId: 'meeting-1', text: 'How does the Q2 roadmap look?', avatarId: 'CAPIVARA' },
        'ip-hash-abc',
      );

      expect(result.status).toBe('Submitted');
      expect(result.avatarId).toBe('CAPIVARA');

      const persisted = await questionRepo.findById(result.id);
      expect(persisted).not.toBeNull();
      expect(persisted!.text).toBe('How does the Q2 roadmap look?');
      expect(persisted!.status).toBe(QuestionStatus.Submitted);
    });

    it('should sanitize HTML from question text', async () => {
      const meeting = createOpenMeeting({ id: 'meeting-1' });
      await meetingRepo.create(meeting);

      const result = await submitQuestion.execute(
        { meetingId: 'meeting-1', text: '<b>Bold question</b> about plans' },
        'ip-hash-abc',
      );

      const persisted = await questionRepo.findById(result.id);
      expect(persisted!.text).not.toContain('<b>');
    });

    it('should reject submission to a closed meeting', async () => {
      const meeting = createMeeting({ id: 'meeting-closed', isOpenForSubmissions: false });
      await meetingRepo.create(meeting);

      await expect(
        submitQuestion.execute(
          { meetingId: 'meeting-closed', text: 'Valid question text' },
          'ip-hash-abc',
        ),
      ).rejects.toMatchObject({ code: 'MEETING_CLOSED' });
    });

    it('should reject submission to non-existent meeting', async () => {
      await expect(
        submitQuestion.execute(
          { meetingId: 'no-such-meeting', text: 'Valid question text' },
          'ip-hash-abc',
        ),
      ).rejects.toMatchObject({ code: 'MEETING_NOT_FOUND' });
    });

    it('should enforce rate limiting', async () => {
      const meeting = createOpenMeeting({ id: 'meeting-1' });
      await meetingRepo.create(meeting);

      for (let i = 0; i < 5; i++) {
        await submitQuestion.execute(
          { meetingId: 'meeting-1', text: `Question number ${i + 1} here` },
          'same-ip-hash',
        );
      }

      await expect(
        submitQuestion.execute(
          { meetingId: 'meeting-1', text: 'One more question please' },
          'same-ip-hash',
        ),
      ).rejects.toMatchObject({ code: 'RATE_LIMITED' });
    });

    it('should allow submission from different IPs even if one is rate limited', async () => {
      const meeting = createOpenMeeting({ id: 'meeting-1' });
      await meetingRepo.create(meeting);

      for (let i = 0; i < 5; i++) {
        await submitQuestion.execute(
          { meetingId: 'meeting-1', text: `Question number ${i + 1} here` },
          'ip-hash-A',
        );
      }

      const result = await submitQuestion.execute(
        { meetingId: 'meeting-1', text: 'From another user entirely' },
        'ip-hash-B',
      );

      expect(result.status).toBe('Submitted');
    });
  });

  describe('GetOpenMeeting — full stack', () => {
    it('should return null when no meeting is open', async () => {
      const result = await getOpenMeeting.execute();
      expect(result).toBeNull();
    });

    it('should return the open meeting', async () => {
      const meeting = createOpenMeeting({ id: 'meeting-open', title: 'Townhall March' });
      await meetingRepo.create(meeting);

      const result = await getOpenMeeting.execute();
      expect(result).not.toBeNull();
      expect(result!.id).toBe('meeting-open');
      expect(result!.title).toBe('Townhall March');
      expect(result!.isOpenForSubmissions).toBe(true);
    });
  });
});
