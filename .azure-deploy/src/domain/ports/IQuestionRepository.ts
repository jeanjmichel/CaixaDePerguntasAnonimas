import { Question } from '../entities/Question';
import { QuestionStatus } from '../enums/QuestionStatus';

export interface OrderBy {
  field: string;
  direction: 'ASC' | 'DESC';
}

export interface IQuestionRepository {
  findById(id: string): Promise<Question | null>;
  findByMeetingAndStatus(meetingId: string, status: QuestionStatus, orderBy?: OrderBy): Promise<Question[]>;
  create(question: Question, ipHash: string): Promise<void>;
  update(question: Question): Promise<void>;
  countRecentByIpHash(ipHash: string, windowMs: number): Promise<number>;
}
