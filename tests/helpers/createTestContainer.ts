import Database from 'better-sqlite3';
import { runMigrations } from '@/infrastructure/database/migrations';
import { SqliteMeetingRepository } from '@/infrastructure/repositories/SqliteMeetingRepository';
import { SqliteQuestionRepository } from '@/infrastructure/repositories/SqliteQuestionRepository';
import { SqliteAdminRepository } from '@/infrastructure/repositories/SqliteAdminRepository';
import { BcryptPasswordHasher } from '@/infrastructure/security/BcryptPasswordHasher';
import { InMemoryRateLimiter } from '@/infrastructure/security/InMemoryRateLimiter';
import { XssSanitizer } from '@/infrastructure/security/XssSanitizer';
import { UuidGenerator } from '@/infrastructure/id/UuidGenerator';
import { Container } from '@/infrastructure/container';

export function createTestContainer(): Container {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
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
