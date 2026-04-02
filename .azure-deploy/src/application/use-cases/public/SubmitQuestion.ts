import { IMeetingRepository } from '@/domain/ports/IMeetingRepository';
import { IQuestionRepository } from '@/domain/ports/IQuestionRepository';
import { IRateLimiter } from '@/domain/ports/IRateLimiter';
import { ISanitizer } from '@/domain/ports/ISanitizer';
import { IIdGenerator } from '@/domain/ports/IIdGenerator';
import { Question } from '@/domain/entities/Question';
import { QuestionStatus } from '@/domain/enums/QuestionStatus';
import { Avatar } from '@/domain/enums/Avatar';
import { InputValidator } from '@/application/validation/InputValidator';
import { ApplicationError } from '@/application/errors/ApplicationError';
import { SubmitQuestionInput } from '@/application/dtos/SubmitQuestionInput';
import { SubmitQuestionOutput } from '@/application/dtos/SubmitQuestionOutput';

export class SubmitQuestionUseCase {
  constructor(
    private readonly meetingRepository: IMeetingRepository,
    private readonly questionRepository: IQuestionRepository,
    private readonly rateLimiter: IRateLimiter,
    private readonly sanitizer: ISanitizer,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(input: SubmitQuestionInput, ipHash: string): Promise<SubmitQuestionOutput> {
    const textValidation = InputValidator.validateQuestionText(input.text);
    if (!textValidation.valid) {
      throw new ApplicationError(textValidation.error!, 'INVALID_INPUT');
    }

    if (input.avatarId) {
      const avatarValidation = InputValidator.validateAvatarId(input.avatarId);
      if (!avatarValidation.valid) {
        throw new ApplicationError(avatarValidation.error!, 'INVALID_INPUT');
      }
    }

    const meeting = await this.meetingRepository.findById(input.meetingId);
    if (!meeting) {
      throw new ApplicationError('Meeting not found', 'MEETING_NOT_FOUND');
    }

    if (!meeting.isOpenForSubmissions) {
      throw new ApplicationError('Meeting is not open for submissions', 'MEETING_CLOSED');
    }

    const rateLimitResult = this.rateLimiter.check(ipHash);
    if (!rateLimitResult.allowed) {
      const error = new ApplicationError('Too many submissions. Please try again later.', 'RATE_LIMITED');
      (error as ApplicationError & { retryAfterMs?: number }).retryAfterMs = rateLimitResult.retryAfterMs;
      throw error;
    }

    const sanitizedText = this.sanitizer.sanitize(input.text.trim());

    const avatarId = input.avatarId || Avatar.random().id;

    const now = new Date();
    const question = new Question({
      id: this.idGenerator.generate(),
      meetingId: input.meetingId,
      avatarId,
      text: sanitizedText,
      status: QuestionStatus.Submitted,
      createdAt: now,
      updatedAt: now,
      selectedAt: null,
      answeredAt: null,
    });

    await this.questionRepository.create(question, ipHash);

    return {
      id: question.id,
      meetingId: question.meetingId,
      avatarId: question.avatarId,
      text: question.text,
      status: question.status,
      createdAt: question.createdAt.toISOString(),
    };
  }
}
