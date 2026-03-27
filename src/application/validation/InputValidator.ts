import { Avatar } from '@/domain/enums/Avatar';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

const QUESTION_MIN_LENGTH = parseInt(process.env.QUESTION_MIN_LENGTH || '5', 10);
const QUESTION_MAX_LENGTH = parseInt(process.env.QUESTION_MAX_LENGTH || '500', 10);

export const InputValidator = {
  validateQuestionText(text: string): ValidationResult {
    if (!text || text.trim().length === 0) {
      return { valid: false, error: 'Question text cannot be empty' };
    }

    const trimmed = text.trim();

    if (trimmed.length < QUESTION_MIN_LENGTH) {
      return {
        valid: false,
        error: `Question text must be at least ${QUESTION_MIN_LENGTH} characters`,
      };
    }

    if (trimmed.length > QUESTION_MAX_LENGTH) {
      return {
        valid: false,
        error: `Question text must be at most ${QUESTION_MAX_LENGTH} characters`,
      };
    }

    return { valid: true };
  },

  validateAvatarId(avatarId: string | undefined | null): ValidationResult {
    if (!avatarId) {
      return { valid: true };
    }

    if (!Avatar.isValid(avatarId)) {
      return { valid: false, error: 'Invalid avatar' };
    }

    return { valid: true };
  },

  validateMeetingTitle(title: string): ValidationResult {
    if (!title || title.trim().length === 0) {
      return { valid: false, error: 'Meeting title cannot be empty' };
    }

    if (title.trim().length > 200) {
      return { valid: false, error: 'Meeting title must be at most 200 characters' };
    }

    return { valid: true };
  },

  validateScheduledAt(dateStr: string): ValidationResult {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return { valid: false, error: 'Invalid date format' };
    }

    return { valid: true };
  },

  validateUsername(username: string): ValidationResult {
    if (!username || username.trim().length === 0) {
      return { valid: false, error: 'Username cannot be empty' };
    }

    if (username.trim().length < 3) {
      return { valid: false, error: 'Username must be at least 3 characters' };
    }

    if (username.trim().length > 50) {
      return { valid: false, error: 'Username must be at most 50 characters' };
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(username.trim())) {
      return { valid: false, error: 'Username can only contain letters, numbers, underscores, dots, and hyphens' };
    }

    return { valid: true };
  },

  validatePassword(password: string): ValidationResult {
    if (!password || password.length === 0) {
      return { valid: false, error: 'Password cannot be empty' };
    }

    if (password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters' };
    }

    if (password.length > 128) {
      return { valid: false, error: 'Password must be at most 128 characters' };
    }

    return { valid: true };
  },
} as const;
