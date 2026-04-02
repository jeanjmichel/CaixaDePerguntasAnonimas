import Database from 'better-sqlite3';
import { IMigrationRunner } from '@/domain/ports/IMigrationRunner';
import { runMigrations } from '@/infrastructure/database/migrations';

export class SqliteMigrationRunner implements IMigrationRunner {
  constructor(private readonly db: Database.Database) {}

  run(): void {
    runMigrations(this.db);
  }
}
