import crypto from 'crypto';
import { Meeting } from '@/domain/entities/Meeting';
import { Question, QuestionProps } from '@/domain/entities/Question';
import { Admin } from '@/domain/entities/Admin';
import { QuestionStatus } from '@/domain/enums/QuestionStatus';

export function createMeeting(overrides: Partial<Meeting> = {}): Meeting {
  const now = new Date();
  return new Meeting({
    id: overrides.id ?? crypto.randomUUID(),
    title: overrides.title ?? 'Test Meeting',
    scheduledAt: overrides.scheduledAt ?? new Date(now.getTime() + 86400000),
    isOpenForSubmissions: overrides.isOpenForSubmissions ?? false,
    openedAt: overrides.openedAt ?? null,
    closedAt: overrides.closedAt ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  });
}

export function createOpenMeeting(overrides: Partial<Meeting> = {}): Meeting {
  return createMeeting({
    isOpenForSubmissions: true,
    openedAt: new Date(),
    ...overrides,
  });
}

export function createQuestion(overrides: Partial<QuestionProps> = {}): Question {
  const now = new Date();
  return new Question({
    id: overrides.id ?? crypto.randomUUID(),
    meetingId: overrides.meetingId ?? crypto.randomUUID(),
    avatarId: overrides.avatarId ?? 'CAPIVARA',
    text: overrides.text ?? 'Test question text with enough characters',
    status: overrides.status ?? QuestionStatus.Submitted,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    selectedAt: overrides.selectedAt ?? null,
    answeredAt: overrides.answeredAt ?? null,
  });
}

export function createAdmin(overrides: Partial<Admin> = {}): Admin {
  const now = new Date();
  return new Admin({
    id: overrides.id ?? crypto.randomUUID(),
    username: overrides.username ?? 'testadmin',
    passwordHash: overrides.passwordHash ?? '$2a$12$fakehashfakehashfakehashfakehashfakehashfakehashfake',
    mustChangePassword: overrides.mustChangePassword ?? false,
    isActive: overrides.isActive ?? true,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  });
}
