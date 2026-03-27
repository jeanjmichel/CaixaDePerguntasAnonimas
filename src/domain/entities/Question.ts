import { QuestionStatus, isValidTransition, isFinalState } from '../enums/QuestionStatus';
import { DomainError } from '../errors/DomainError';

export interface QuestionProps {
  id: string;
  meetingId: string;
  avatarId: string;
  text: string;
  status: QuestionStatus;
  createdAt: Date;
  updatedAt: Date;
  selectedAt: Date | null;
  answeredAt: Date | null;
}

export class Question {
  readonly id: string;
  readonly meetingId: string;
  readonly avatarId: string;
  readonly text: string;
  readonly status: QuestionStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly selectedAt: Date | null;
  readonly answeredAt: Date | null;

  constructor(props: QuestionProps) {
    this.id = props.id;
    this.meetingId = props.meetingId;
    this.avatarId = props.avatarId;
    this.text = props.text;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.selectedAt = props.selectedAt;
    this.answeredAt = props.answeredAt;
  }

  transitionTo(newStatus: QuestionStatus): Question {
    if (this.status === newStatus) {
      return this;
    }

    if (isFinalState(this.status)) {
      throw new DomainError(
        `Cannot transition from ${this.status}: it is a final state`
      );
    }

    if (!isValidTransition(this.status, newStatus)) {
      throw new DomainError(
        `Invalid transition from ${this.status} to ${newStatus}`
      );
    }

    const now = new Date();
    const updates: Partial<QuestionProps> = {
      status: newStatus,
      updatedAt: now,
    };

    if (newStatus === QuestionStatus.Selected) {
      updates.selectedAt = now;
    }

    if (newStatus === QuestionStatus.Answered) {
      updates.answeredAt = now;
    }

    return new Question({
      ...this.toProps(),
      ...updates,
    });
  }

  toProps(): QuestionProps {
    return {
      id: this.id,
      meetingId: this.meetingId,
      avatarId: this.avatarId,
      text: this.text,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      selectedAt: this.selectedAt,
      answeredAt: this.answeredAt,
    };
  }
}
