import { IQuestionRepository } from '@/domain/ports/IQuestionRepository';
import { QuestionStatus } from '@/domain/enums/QuestionStatus';
import { ApplicationError } from '@/application/errors/ApplicationError';
import { QuestionResponseDTO } from '@/application/dtos/QuestionResponseDTO';
import { questionToDTO } from './questionMapper';

const ORDER_BY_STATUS: Record<QuestionStatus, { field: string; direction: 'ASC' | 'DESC' }> = {
  [QuestionStatus.Submitted]: { field: 'created_at', direction: 'DESC' },
  [QuestionStatus.Selected]: { field: 'selected_at', direction: 'ASC' },
  [QuestionStatus.Answered]: { field: 'answered_at', direction: 'DESC' },
  [QuestionStatus.Discarded]: { field: 'updated_at', direction: 'DESC' },
};

export class ListQuestionsByStatusUseCase {
  constructor(
    private readonly questionRepository: IQuestionRepository,
  ) {}

  async execute(meetingId: string, status: QuestionStatus): Promise<QuestionResponseDTO[]> {
    if (!meetingId || meetingId.trim().length === 0) {
      throw new ApplicationError('Meeting ID is required', 'INVALID_INPUT');
    }

    if (!Object.values(QuestionStatus).includes(status)) {
      throw new ApplicationError('Invalid question status', 'INVALID_INPUT');
    }

    const orderBy = ORDER_BY_STATUS[status];
    const questions = await this.questionRepository.findByMeetingAndStatus(meetingId, status, orderBy);

    return questions.map(questionToDTO);
  }
}
