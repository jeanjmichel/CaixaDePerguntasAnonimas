import { SubmitQuestionUseCase } from '@/application/use-cases/public/SubmitQuestion';
import { ApplicationError } from '@/application/errors/ApplicationError';
import { IMeetingRepository } from '@/domain/ports/IMeetingRepository';
import { IQuestionRepository } from '@/domain/ports/IQuestionRepository';
import { IRateLimiter } from '@/domain/ports/IRateLimiter';
import { ISanitizer } from '@/domain/ports/ISanitizer';
import { IIdGenerator } from '@/domain/ports/IIdGenerator';
import { createOpenMeeting, createMeeting } from '../../helpers/factories';

describe('SubmitQuestionUseCase', () => {
  let useCase: SubmitQuestionUseCase;
  let meetingRepository: jest.Mocked<IMeetingRepository>;
  let questionRepository: jest.Mocked<IQuestionRepository>;
  let rateLimiter: jest.Mocked<IRateLimiter>;
  let sanitizer: jest.Mocked<ISanitizer>;
  let idGenerator: jest.Mocked<IIdGenerator>;

  const ipHash = 'abc123hash';

  beforeEach(() => {
    meetingRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findOpenForSubmissions: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      closeAllOpen: jest.fn(),
    };
    questionRepository = {
      findById: jest.fn(),
      findByMeetingAndStatus: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      countRecentByIpHash: jest.fn(),
    };
    rateLimiter = {
      check: jest.fn().mockReturnValue({ allowed: true }),
    };
    sanitizer = {
      sanitize: jest.fn().mockImplementation((text: string) => text),
    };
    idGenerator = {
      generate: jest.fn().mockReturnValue('generated-uuid'),
    };

    useCase = new SubmitQuestionUseCase(
      meetingRepository,
      questionRepository,
      rateLimiter,
      sanitizer,
      idGenerator,
    );
  });

  it('should submit a question successfully with explicit avatar', async () => {
    const meeting = createOpenMeeting();
    meetingRepository.findById.mockResolvedValue(meeting);

    const result = await useCase.execute(
      { meetingId: meeting.id, text: 'What is the roadmap for Q2?', avatarId: 'CAPIVARA' },
      ipHash,
    );

    expect(result.id).toBe('generated-uuid');
    expect(result.meetingId).toBe(meeting.id);
    expect(result.avatarId).toBe('CAPIVARA');
    expect(result.text).toBe('What is the roadmap for Q2?');
    expect(result.status).toBe('Submitted');
    expect(typeof result.createdAt).toBe('string');
    expect(questionRepository.create).toHaveBeenCalledTimes(1);
  });

  it('should auto-assign random avatar when avatarId not provided', async () => {
    const meeting = createOpenMeeting();
    meetingRepository.findById.mockResolvedValue(meeting);

    const result = await useCase.execute(
      { meetingId: meeting.id, text: 'Question without avatar choice' },
      ipHash,
    );

    expect(result.avatarId).toBeTruthy();
    expect(typeof result.avatarId).toBe('string');
    expect(questionRepository.create).toHaveBeenCalledTimes(1);
  });

  it('should throw INVALID_INPUT for empty text', async () => {
    await expect(
      useCase.execute({ meetingId: 'any', text: '' }, ipHash),
    ).rejects.toThrow(ApplicationError);

    await expect(
      useCase.execute({ meetingId: 'any', text: '' }, ipHash),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  });

  it('should throw INVALID_INPUT for text shorter than 5 characters', async () => {
    await expect(
      useCase.execute({ meetingId: 'any', text: 'Hi' }, ipHash),
    ).rejects.toThrow(ApplicationError);

    await expect(
      useCase.execute({ meetingId: 'any', text: 'Hi' }, ipHash),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  });

  it('should throw INVALID_INPUT for text longer than 500 characters', async () => {
    const longText = 'a'.repeat(501);

    await expect(
      useCase.execute({ meetingId: 'any', text: longText }, ipHash),
    ).rejects.toThrow(ApplicationError);

    await expect(
      useCase.execute({ meetingId: 'any', text: longText }, ipHash),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  });

  it('should throw INVALID_INPUT for invalid avatarId', async () => {
    await expect(
      useCase.execute({ meetingId: 'any', text: 'Valid question text', avatarId: 'UNICORN' }, ipHash),
    ).rejects.toThrow(ApplicationError);

    await expect(
      useCase.execute({ meetingId: 'any', text: 'Valid question text', avatarId: 'UNICORN' }, ipHash),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  });

  it('should throw MEETING_NOT_FOUND when meeting does not exist', async () => {
    meetingRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ meetingId: 'nonexistent', text: 'Valid question text' }, ipHash),
    ).rejects.toThrow(ApplicationError);

    await expect(
      useCase.execute({ meetingId: 'nonexistent', text: 'Valid question text' }, ipHash),
    ).rejects.toMatchObject({ code: 'MEETING_NOT_FOUND' });
  });

  it('should throw MEETING_CLOSED when meeting is not open for submissions', async () => {
    const closedMeeting = createMeeting({ isOpenForSubmissions: false });
    meetingRepository.findById.mockResolvedValue(closedMeeting);

    await expect(
      useCase.execute({ meetingId: closedMeeting.id, text: 'Valid question text' }, ipHash),
    ).rejects.toThrow(ApplicationError);

    await expect(
      useCase.execute({ meetingId: closedMeeting.id, text: 'Valid question text' }, ipHash),
    ).rejects.toMatchObject({ code: 'MEETING_CLOSED' });
  });

  it('should throw RATE_LIMITED when rate limit is exceeded', async () => {
    const meeting = createOpenMeeting();
    meetingRepository.findById.mockResolvedValue(meeting);
    rateLimiter.check.mockReturnValue({ allowed: false, retryAfterMs: 30000 });

    await expect(
      useCase.execute({ meetingId: meeting.id, text: 'Valid question text' }, ipHash),
    ).rejects.toThrow(ApplicationError);

    try {
      await useCase.execute({ meetingId: meeting.id, text: 'Valid question text' }, ipHash);
    } catch (error) {
      expect(error).toBeInstanceOf(ApplicationError);
      expect((error as ApplicationError).code).toBe('RATE_LIMITED');
      expect((error as ApplicationError & { retryAfterMs?: number }).retryAfterMs).toBe(30000);
    }
  });

  it('should sanitize text before persisting', async () => {
    const meeting = createOpenMeeting();
    meetingRepository.findById.mockResolvedValue(meeting);
    sanitizer.sanitize.mockReturnValue('clean text here');

    const result = await useCase.execute(
      { meetingId: meeting.id, text: '<script>alert("xss")</script>clean text here' },
      ipHash,
    );

    expect(sanitizer.sanitize).toHaveBeenCalled();
    expect(result.text).toBe('clean text here');
  });

  it('should pass ipHash to repository create', async () => {
    const meeting = createOpenMeeting();
    meetingRepository.findById.mockResolvedValue(meeting);

    await useCase.execute(
      { meetingId: meeting.id, text: 'Valid question text' },
      ipHash,
    );

    expect(questionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Valid question text' }),
      ipHash,
    );
  });
});
