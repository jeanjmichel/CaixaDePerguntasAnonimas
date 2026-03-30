import { ListQuestionsByStatusUseCase } from '@/application/use-cases/questions/ListQuestionsByStatus';
import { IQuestionRepository } from '@/domain/ports/IQuestionRepository';
import { QuestionStatus } from '@/domain/enums/QuestionStatus';
import { ApplicationError } from '@/application/errors/ApplicationError';
import { createQuestion } from '../../helpers/factories';

describe('ListQuestionsByStatusUseCase', () => {
  let useCase: ListQuestionsByStatusUseCase;
  let questionRepository: jest.Mocked<IQuestionRepository>;

  beforeEach(() => {
    questionRepository = {
      findById: jest.fn(),
      findByMeetingAndStatus: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      countRecentByIpHash: jest.fn(),
    };
    useCase = new ListQuestionsByStatusUseCase(questionRepository);
  });

  it('should return empty array when no questions match', async () => {
    questionRepository.findByMeetingAndStatus.mockResolvedValue([]);

    const result = await useCase.execute('meeting-1', QuestionStatus.Submitted);

    expect(result).toEqual([]);
    expect(questionRepository.findByMeetingAndStatus).toHaveBeenCalledWith(
      'meeting-1',
      QuestionStatus.Submitted,
      { field: 'created_at', direction: 'DESC' },
    );
  });

  it('should return DTOs for matching questions', async () => {
    const questions = [
      createQuestion({ id: 'q1', meetingId: 'meeting-1', avatarId: 'CAPIVARA' }),
      createQuestion({ id: 'q2', meetingId: 'meeting-1', avatarId: 'EMA' }),
    ];
    questionRepository.findByMeetingAndStatus.mockResolvedValue(questions);

    const result = await useCase.execute('meeting-1', QuestionStatus.Submitted);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('q1');
    expect(result[0].avatarDisplayName).toBe('Capivara');
    expect(result[0].avatarIcon).toBe('🦫');
    expect(result[1].avatarDisplayName).toBe('Ema');
  });

  it('should use selectedAt ASC ordering for Selected status', async () => {
    questionRepository.findByMeetingAndStatus.mockResolvedValue([]);

    await useCase.execute('meeting-1', QuestionStatus.Selected);

    expect(questionRepository.findByMeetingAndStatus).toHaveBeenCalledWith(
      'meeting-1',
      QuestionStatus.Selected,
      { field: 'selected_at', direction: 'ASC' },
    );
  });

  it('should use answeredAt DESC ordering for Answered status', async () => {
    questionRepository.findByMeetingAndStatus.mockResolvedValue([]);

    await useCase.execute('meeting-1', QuestionStatus.Answered);

    expect(questionRepository.findByMeetingAndStatus).toHaveBeenCalledWith(
      'meeting-1',
      QuestionStatus.Answered,
      { field: 'answered_at', direction: 'DESC' },
    );
  });

  it('should throw INVALID_INPUT for empty meetingId', async () => {
    await expect(
      useCase.execute('', QuestionStatus.Submitted),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  });
});
