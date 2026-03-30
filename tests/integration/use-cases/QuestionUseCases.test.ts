import Database from 'better-sqlite3';
import { runMigrations } from '@/infrastructure/database/migrations';
import { SqliteMeetingRepository } from '@/infrastructure/repositories/SqliteMeetingRepository';
import { SqliteQuestionRepository } from '@/infrastructure/repositories/SqliteQuestionRepository';
import { InMemoryRateLimiter } from '@/infrastructure/security/InMemoryRateLimiter';
import { XssSanitizer } from '@/infrastructure/security/XssSanitizer';
import { UuidGenerator } from '@/infrastructure/id/UuidGenerator';
import { SubmitQuestionUseCase } from '@/application/use-cases/public/SubmitQuestion';
import { ListQuestionsByStatusUseCase } from '@/application/use-cases/questions/ListQuestionsByStatus';
import { SelectQuestionUseCase } from '@/application/use-cases/questions/SelectQuestion';
import { DiscardQuestionUseCase } from '@/application/use-cases/questions/DiscardQuestion';
import { AnswerQuestionUseCase } from '@/application/use-cases/questions/AnswerQuestion';
import { QuestionStatus } from '@/domain/enums/QuestionStatus';
import { ApplicationError } from '@/application/errors/ApplicationError';
import { createOpenMeeting } from '../../helpers/factories';

describe('Question Use Cases — Integration', () => {
  let db: Database.Database;
  let meetingRepo: SqliteMeetingRepository;
  let questionRepo: SqliteQuestionRepository;
  let submitQuestion: SubmitQuestionUseCase;
  let listByStatus: ListQuestionsByStatusUseCase;
  let selectQuestion: SelectQuestionUseCase;
  let discardQuestion: DiscardQuestionUseCase;
  let answerQuestion: AnswerQuestionUseCase;

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
    listByStatus = new ListQuestionsByStatusUseCase(questionRepo);
    selectQuestion = new SelectQuestionUseCase(questionRepo);
    discardQuestion = new DiscardQuestionUseCase(questionRepo);
    answerQuestion = new AnswerQuestionUseCase(questionRepo);
  });

  afterEach(() => {
    db.close();
  });

  async function submitTestQuestion(meetingId: string, text: string) {
    return submitQuestion.execute(
      { meetingId, text, avatarId: 'CAPIVARA' },
      'ip-hash-test',
    );
  }

  describe('Fluxo completo: Submit → Select → Answer', () => {
    it('should transition a question through the full happy path', async () => {
      const meeting = createOpenMeeting({ id: 'meeting-1' });
      await meetingRepo.create(meeting);

      const submitted = await submitTestQuestion('meeting-1', 'What is the Q3 roadmap?');

      const submittedList = await listByStatus.execute('meeting-1', QuestionStatus.Submitted);
      expect(submittedList).toHaveLength(1);
      expect(submittedList[0].id).toBe(submitted.id);
      expect(submittedList[0].avatarDisplayName).toBe('Capivara');
      expect(submittedList[0].avatarIcon).toBe('🦫');

      const selected = await selectQuestion.execute(submitted.id);
      expect(selected.status).toBe('Selected');
      expect(selected.selectedAt).toBeDefined();

      const selectedList = await listByStatus.execute('meeting-1', QuestionStatus.Selected);
      expect(selectedList).toHaveLength(1);

      const submittedAfter = await listByStatus.execute('meeting-1', QuestionStatus.Submitted);
      expect(submittedAfter).toHaveLength(0);

      const answered = await answerQuestion.execute(submitted.id);
      expect(answered.status).toBe('Answered');
      expect(answered.answeredAt).toBeDefined();

      const answeredList = await listByStatus.execute('meeting-1', QuestionStatus.Answered);
      expect(answeredList).toHaveLength(1);
    });
  });

  describe('Discard from Submitted and Selected', () => {
    it('should discard a Submitted question', async () => {
      const meeting = createOpenMeeting({ id: 'meeting-1' });
      await meetingRepo.create(meeting);

      const submitted = await submitTestQuestion('meeting-1', 'This question should be discarded');

      const discarded = await discardQuestion.execute(submitted.id);
      expect(discarded.status).toBe('Discarded');

      const discardedList = await listByStatus.execute('meeting-1', QuestionStatus.Discarded);
      expect(discardedList).toHaveLength(1);
    });

    it('should discard a Selected question', async () => {
      const meeting = createOpenMeeting({ id: 'meeting-1' });
      await meetingRepo.create(meeting);

      const submitted = await submitTestQuestion('meeting-1', 'Selected then discarded');
      await selectQuestion.execute(submitted.id);

      const discarded = await discardQuestion.execute(submitted.id);
      expect(discarded.status).toBe('Discarded');
    });
  });

  describe('Invalid transitions', () => {
    it('should reject Submitted → Answered (must go through Selected first)', async () => {
      const meeting = createOpenMeeting({ id: 'meeting-1' });
      await meetingRepo.create(meeting);

      const submitted = await submitTestQuestion('meeting-1', 'Cannot skip to answered');

      await expect(answerQuestion.execute(submitted.id)).rejects.toMatchObject({
        code: 'INVALID_TRANSITION',
      });
    });

    it('should reject select on a Discarded question', async () => {
      const meeting = createOpenMeeting({ id: 'meeting-1' });
      await meetingRepo.create(meeting);

      const submitted = await submitTestQuestion('meeting-1', 'Discarded question');
      await discardQuestion.execute(submitted.id);

      await expect(selectQuestion.execute(submitted.id)).rejects.toMatchObject({
        code: 'INVALID_TRANSITION',
      });
    });

    it('should reject discard on an Answered question', async () => {
      const meeting = createOpenMeeting({ id: 'meeting-1' });
      await meetingRepo.create(meeting);

      const submitted = await submitTestQuestion('meeting-1', 'Answered question');
      await selectQuestion.execute(submitted.id);
      await answerQuestion.execute(submitted.id);

      await expect(discardQuestion.execute(submitted.id)).rejects.toMatchObject({
        code: 'INVALID_TRANSITION',
      });
    });
  });

  describe('Multiple questions per meeting', () => {
    it('should list multiple questions filtered by status', async () => {
      const meeting = createOpenMeeting({ id: 'meeting-1' });
      await meetingRepo.create(meeting);

      const q1 = await submitTestQuestion('meeting-1', 'First question here');
      const q2 = await submitTestQuestion('meeting-1', 'Second question here');
      const q3 = await submitTestQuestion('meeting-1', 'Third question here');

      await selectQuestion.execute(q1.id);
      await selectQuestion.execute(q2.id);

      const submitted = await listByStatus.execute('meeting-1', QuestionStatus.Submitted);
      expect(submitted).toHaveLength(1);
      expect(submitted[0].id).toBe(q3.id);

      const selected = await listByStatus.execute('meeting-1', QuestionStatus.Selected);
      expect(selected).toHaveLength(2);
    });
  });
});
