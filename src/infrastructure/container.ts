import Database from 'better-sqlite3';
import { IMeetingRepository } from '@/domain/ports/IMeetingRepository';
import { IQuestionRepository } from '@/domain/ports/IQuestionRepository';
import { IAdminRepository } from '@/domain/ports/IAdminRepository';
import { IPasswordHasher } from '@/domain/ports/IPasswordHasher';
import { IIdGenerator } from '@/domain/ports/IIdGenerator';
import { IRateLimiter } from '@/domain/ports/IRateLimiter';
import { ISanitizer } from '@/domain/ports/ISanitizer';
import { getDatabase } from './database/connection';
import { runMigrations } from './database/migrations';
import { SqliteMeetingRepository } from './repositories/SqliteMeetingRepository';
import { SqliteQuestionRepository } from './repositories/SqliteQuestionRepository';
import { SqliteAdminRepository } from './repositories/SqliteAdminRepository';
import { BcryptPasswordHasher } from './security/BcryptPasswordHasher';
import { InMemoryRateLimiter } from './security/InMemoryRateLimiter';
import { XssSanitizer } from './security/XssSanitizer';
import { UuidGenerator } from './id/UuidGenerator';

export interface Container {
  db: Database.Database;
  meetingRepository: IMeetingRepository;
  questionRepository: IQuestionRepository;
  adminRepository: IAdminRepository;
  passwordHasher: IPasswordHasher;
  idGenerator: IIdGenerator;
  rateLimiter: IRateLimiter;
  sanitizer: ISanitizer;
}

let container: Container | null = null;

export function getContainer(): Container {
  if (container) {
    return container;
  }

  const db = getDatabase();
  runMigrations(db);

  const rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
  const rateLimitMaxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5', 10);

  container = {
    db,
    meetingRepository: new SqliteMeetingRepository(db),
    questionRepository: new SqliteQuestionRepository(db),
    adminRepository: new SqliteAdminRepository(db),
    passwordHasher: new BcryptPasswordHasher(),
    idGenerator: new UuidGenerator(),
    rateLimiter: new InMemoryRateLimiter(rateLimitWindowMs, rateLimitMaxRequests),
    sanitizer: new XssSanitizer(),
  };

  return container;
}

export function createTestContainer(db: Database.Database): Container {
  runMigrations(db);

  return {
    db,
    meetingRepository: new SqliteMeetingRepository(db),
    questionRepository: new SqliteQuestionRepository(db),
    adminRepository: new SqliteAdminRepository(db),
    passwordHasher: new BcryptPasswordHasher(),
    idGenerator: new UuidGenerator(),
    rateLimiter: new InMemoryRateLimiter(60000, 5),
    sanitizer: new XssSanitizer(),
  };
}
