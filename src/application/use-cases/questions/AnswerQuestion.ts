import { IQuestionRepository } from '@/domain/ports/IQuestionRepository';
import { QuestionStatus } from '@/domain/enums/QuestionStatus';
import { DomainError } from '@/domain/errors/DomainError';
import { ApplicationError } from '@/application/errors/ApplicationError';
import { QuestionResponseDTO } from '@/application/dtos/QuestionResponseDTO';
import { questionToDTO } from './questionMapper';

export class AnswerQuestionUseCase {
  constructor(
    private readonly questionRepository: IQuestionRepository,
  ) {}

  async execute(questionId: string): Promise<QuestionResponseDTO> {
    const question = await this.questionRepository.findById(questionId);
    if (!question) {
      throw new ApplicationError('Question not found', 'QUESTION_NOT_FOUND');
    }

    try {
      const answered = question.transitionTo(QuestionStatus.Answered);
      await this.questionRepository.update(answered);
      return questionToDTO(answered);
    } catch (error) {
      if (error instanceof DomainError) {
        throw new ApplicationError(error.message, 'INVALID_TRANSITION');
      }
      throw error;
    }
  }
}
