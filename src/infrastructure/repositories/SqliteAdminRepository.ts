import Database from 'better-sqlite3';
import { Admin } from '@/domain/entities/Admin';
import { IAdminRepository } from '@/domain/ports/IAdminRepository';

interface AdminRow {
  id: string;
  username: string;
  password_hash: string;
  must_change_password: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

function rowToAdmin(row: AdminRow): Admin {
  return new Admin({
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    mustChangePassword: row.must_change_password === 1,
    isActive: row.is_active === 1,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  });
}

export class SqliteAdminRepository implements IAdminRepository {
  constructor(private readonly db: Database.Database) {}

  async findById(id: string): Promise<Admin | null> {
    const row = this.db
      .prepare('SELECT * FROM admins WHERE id = ?')
      .get(id) as AdminRow | undefined;

    return row ? rowToAdmin(row) : null;
  }

  async findByUsername(username: string): Promise<Admin | null> {
    const row = this.db
      .prepare('SELECT * FROM admins WHERE username = ?')
      .get(username) as AdminRow | undefined;

    return row ? rowToAdmin(row) : null;
  }

  async findAll(): Promise<Admin[]> {
    const rows = this.db
      .prepare('SELECT * FROM admins ORDER BY created_at ASC')
      .all() as AdminRow[];

    return rows.map(rowToAdmin);
  }

  async create(admin: Admin): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO admins (id, username, password_hash, must_change_password, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        admin.id,
        admin.username,
        admin.passwordHash,
        admin.mustChangePassword ? 1 : 0,
        admin.isActive ? 1 : 0,
        admin.createdAt.toISOString(),
        admin.updatedAt.toISOString()
      );
  }

  async update(admin: Admin): Promise<void> {
    this.db
      .prepare(
        `UPDATE admins SET
           username = ?,
           password_hash = ?,
           must_change_password = ?,
           is_active = ?,
           updated_at = ?
         WHERE id = ?`
      )
      .run(
        admin.username,
        admin.passwordHash,
        admin.mustChangePassword ? 1 : 0,
        admin.isActive ? 1 : 0,
        admin.updatedAt.toISOString(),
        admin.id
      );
  }
}
