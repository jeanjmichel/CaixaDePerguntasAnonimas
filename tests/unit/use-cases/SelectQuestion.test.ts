import { SelectQuestionUseCase } from '@/application/use-cases/questions/SelectQuestion';
import { IQuestionRepository } from '@/domain/ports/IQuestionRepository';
import { QuestionStatus } from '@/domain/enums/QuestionStatus';
import { ApplicationError } from '@/application/errors/ApplicationError';
import { createQuestion } from '../../helpers/factories';

describe('SelectQuestionUseCase', () => {
  let useCase: SelectQuestionUseCase;
  let questionRepository: jest.Mocked<IQuestionRepository>;

  beforeEach(() => {
    questionRepository = {
      findById: jest.fn(),
      findByMeetingAndStatus: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      countRecentByIpHash: jest.fn(),
    };
    useCase = new SelectQuestionUseCase(questionRepository);
  });

  it('should select a Submitted question', async () => {
    const question = createQuestion({ id: 'q1', status: QuestionStatus.Submitted });
    questionRepository.findById.mockResolvedValue(question);

    const result = await useCase.execute('q1');

    expect(result.status).toBe('Selected');
    expect(result.selectedAt).toBeDefined();
    expect(questionRepository.update).toHaveBeenCalledTimes(1);
  });

  it('should throw QUESTION_NOT_FOUND when question does not exist', async () => {
    questionRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('nonexistent')).rejects.toMatchObject({
      code: 'QUESTION_NOT_FOUND',
    });
  });

  it('should throw INVALID_TRANSITION when transitioning from Answered', async () => {
    const question = createQuestion({ id: 'q1', status: QuestionStatus.Answered, answeredAt: new Date() });
    questionRepository.findById.mockResolvedValue(question);

    await expect(useCase.execute('q1')).rejects.toMatchObject({
      code: 'INVALID_TRANSITION',
    });

    expect(questionRepository.update).not.toHaveBeenCalled();
  });

  it('should throw INVALID_TRANSITION when transitioning from Discarded', async () => {
    const question = createQuestion({ id: 'q1', status: QuestionStatus.Discarded });
    questionRepository.findById.mockResolvedValue(question);

    await expect(useCase.execute('q1')).rejects.toMatchObject({
      code: 'INVALID_TRANSITION',
    });
  });
});
