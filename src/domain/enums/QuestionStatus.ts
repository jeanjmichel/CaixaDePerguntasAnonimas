export enum QuestionStatus {
  Submitted = 'Submitted',
  Selected = 'Selected',
  Discarded = 'Discarded',
  Answered = 'Answered',
}

const VALID_TRANSITIONS: Record<QuestionStatus, QuestionStatus[]> = {
  [QuestionStatus.Submitted]: [QuestionStatus.Selected, QuestionStatus.Discarded],
  [QuestionStatus.Selected]: [QuestionStatus.Answered, QuestionStatus.Discarded],
  [QuestionStatus.Discarded]: [],
  [QuestionStatus.Answered]: [],
};

const FINAL_STATES: ReadonlySet<QuestionStatus> = new Set([
  QuestionStatus.Discarded,
  QuestionStatus.Answered,
]);

export function isValidTransition(from: QuestionStatus, to: QuestionStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

export function isFinalState(status: QuestionStatus): boolean {
  return FINAL_STATES.has(status);
}

export function getValidTransitions(status: QuestionStatus): QuestionStatus[] {
  return [...VALID_TRANSITIONS[status]];
}
