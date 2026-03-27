import { Question } from '@/domain/entities/Question';
import { QuestionStatus } from '@/domain/enums/QuestionStatus';
import { DomainError } from '@/domain/errors/DomainError';
import { createQuestion } from '../../helpers/factories';

describe('Question', () => {
  describe('construction', () => {
    it('should create a question with all properties', () => {
      const now = new Date();
      const question = createQuestion({
        id: 'q1',
        meetingId: 'm1',
        avatarId: 'CAPIVARA',
        text: 'Test question',
        status: QuestionStatus.Submitted,
        createdAt: now,
        updatedAt: now,
        selectedAt: null,
        answeredAt: null,
      });

      expect(question.id).toBe('q1');
      expect(question.meetingId).toBe('m1');
      expect(question.avatarId).toBe('CAPIVARA');
      expect(question.text).toBe('Test question');
      expect(question.status).toBe(QuestionStatus.Submitted);
      expect(question.selectedAt).toBeNull();
      expect(question.answeredAt).toBeNull();
    });
  });

  describe('transitionTo', () => {
    describe('valid transitions', () => {
      it('should transition from Submitted to Selected', () => {
        const question = createQuestion({ status: QuestionStatus.Submitted });
        const updated = question.transitionTo(QuestionStatus.Selected);

        expect(updated.status).toBe(QuestionStatus.Selected);
        expect(updated.selectedAt).toBeInstanceOf(Date);
        expect(updated.answeredAt).toBeNull();
        expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(question.updatedAt.getTime());
      });

      it('should transition from Submitted to Discarded', () => {
        const question = createQuestion({ status: QuestionStatus.Submitted });
        const updated = question.transitionTo(QuestionStatus.Discarded);

        expect(updated.status).toBe(QuestionStatus.Discarded);
        expect(updated.selectedAt).toBeNull();
        expect(updated.answeredAt).toBeNull();
      });

      it('should transition from Selected to Answered', () => {
        const question = createQuestion({
          status: QuestionStatus.Selected,
          selectedAt: new Date(),
        });
        const updated = question.transitionTo(QuestionStatus.Answered);

        expect(updated.status).toBe(QuestionStatus.Answered);
        expect(updated.answeredAt).toBeInstanceOf(Date);
        expect(updated.selectedAt).toEqual(question.selectedAt);
      });

      it('should transition from Selected to Discarded', () => {
        const question = createQuestion({
          status: QuestionStatus.Selected,
          selectedAt: new Date(),
        });
        const updated = question.transitionTo(QuestionStatus.Discarded);

        expect(updated.status).toBe(QuestionStatus.Discarded);
      });
    });

    describe('idempotent transitions', () => {
      it('should return same instance when transitioning to current status (Submitted -> Submitted)', () => {
        const question = createQuestion({ status: QuestionStatus.Submitted });
        const result = question.transitionTo(QuestionStatus.Submitted);

        expect(result).toBe(question);
      });

      it('should return same instance when transitioning Selected -> Selected', () => {
        const question = createQuestion({ status: QuestionStatus.Selected });
        const result = question.transitionTo(QuestionStatus.Selected);

        expect(result).toBe(question);
      });

      it('should return same instance when transitioning Discarded -> Discarded', () => {
        const question = createQuestion({ status: QuestionStatus.Discarded });
        const result = question.transitionTo(QuestionStatus.Discarded);

        expect(result).toBe(question);
      });

      it('should return same instance when transitioning Answered -> Answered', () => {
        const question = createQuestion({ status: QuestionStatus.Answered });
        const result = question.transitionTo(QuestionStatus.Answered);

        expect(result).toBe(question);
      });
    });

    describe('invalid transitions', () => {
      it('should throw when transitioning from Discarded to Selected', () => {
        const question = createQuestion({ status: QuestionStatus.Discarded });

        expect(() => question.transitionTo(QuestionStatus.Selected)).toThrow(DomainError);
        expect(() => question.transitionTo(QuestionStatus.Selected)).toThrow(
          'Cannot transition from Discarded: it is a final state'
        );
      });

      it('should throw when transitioning from Discarded to Submitted', () => {
        const question = createQuestion({ status: QuestionStatus.Discarded });

        expect(() => question.transitionTo(QuestionStatus.Submitted)).toThrow(DomainError);
      });

      it('should throw when transitioning from Discarded to Answered', () => {
        const question = createQuestion({ status: QuestionStatus.Discarded });

        expect(() => question.transitionTo(QuestionStatus.Answered)).toThrow(DomainError);
      });

      it('should throw when transitioning from Answered to Selected', () => {
        const question = createQuestion({ status: QuestionStatus.Answered });

        expect(() => question.transitionTo(QuestionStatus.Selected)).toThrow(DomainError);
        expect(() => question.transitionTo(QuestionStatus.Selected)).toThrow(
          'Cannot transition from Answered: it is a final state'
        );
      });

      it('should throw when transitioning from Answered to Submitted', () => {
        const question = createQuestion({ status: QuestionStatus.Answered });

        expect(() => question.transitionTo(QuestionStatus.Submitted)).toThrow(DomainError);
      });

      it('should throw when transitioning from Answered to Discarded', () => {
        const question = createQuestion({ status: QuestionStatus.Answered });

        expect(() => question.transitionTo(QuestionStatus.Discarded)).toThrow(DomainError);
      });

      it('should throw when transitioning from Submitted to Answered (skip)', () => {
        const question = createQuestion({ status: QuestionStatus.Submitted });

        expect(() => question.transitionTo(QuestionStatus.Answered)).toThrow(DomainError);
        expect(() => question.transitionTo(QuestionStatus.Answered)).toThrow(
          'Invalid transition from Submitted to Answered'
        );
      });

      it('should throw when transitioning from Selected to Submitted (backward)', () => {
        const question = createQuestion({ status: QuestionStatus.Selected });

        expect(() => question.transitionTo(QuestionStatus.Submitted)).toThrow(DomainError);
        expect(() => question.transitionTo(QuestionStatus.Submitted)).toThrow(
          'Invalid transition from Selected to Submitted'
        );
      });
    });
  });

  describe('toProps', () => {
    it('should return all properties', () => {
      const now = new Date();
      const question = createQuestion({
        id: 'q1',
        meetingId: 'm1',
        avatarId: 'EMA',
        text: 'A question',
        status: QuestionStatus.Submitted,
        createdAt: now,
        updatedAt: now,
      });

      const props = question.toProps();
      expect(props.id).toBe('q1');
      expect(props.meetingId).toBe('m1');
      expect(props.avatarId).toBe('EMA');
      expect(props.text).toBe('A question');
      expect(props.status).toBe(QuestionStatus.Submitted);
    });
  });
});
