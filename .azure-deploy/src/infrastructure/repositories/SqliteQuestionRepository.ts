import Database from 'better-sqlite3';
import { Question } from '@/domain/entities/Question';
import { QuestionStatus } from '@/domain/enums/QuestionStatus';
import { IQuestionRepository, OrderBy } from '@/domain/ports/IQuestionRepository';

interface QuestionRow {
  id: string;
  meeting_id: string;
  avatar_id: string;
  text: string;
  status: string;
  ip_hash: string;
  created_at: string;
  updated_at: string;
  selected_at: string | null;
  answered_at: string | null;
}

function rowToQuestion(row: QuestionRow): Question {
  return new Question({
    id: row.id,
    meetingId: row.meeting_id,
    avatarId: row.avatar_id,
    text: row.text,
    status: row.status as QuestionStatus,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    selectedAt: row.selected_at ? new Date(row.selected_at) : null,
    answeredAt: row.answered_at ? new Date(row.answered_at) : null,
  });
}

const ALLOWED_ORDER_FIELDS = new Set(['created_at', 'selected_at', 'answered_at', 'updated_at']);
const ALLOWED_DIRECTIONS = new Set(['ASC', 'DESC']);

function buildOrderClause(orderBy?: OrderBy): string {
  if (!orderBy) {
    return 'ORDER BY created_at DESC';
  }

  const field = ALLOWED_ORDER_FIELDS.has(orderBy.field) ? orderBy.field : 'created_at';
  const direction = ALLOWED_DIRECTIONS.has(orderBy.direction) ? orderBy.direction : 'DESC';

  return `ORDER BY ${field} ${direction}`;
}

export class SqliteQuestionRepository implements IQuestionRepository {
  constructor(private readonly db: Database.Database) {}

  async findById(id: string): Promise<Question | null> {
    const row = this.db
      .prepare('SELECT * FROM questions WHERE id = ?')
      .get(id) as QuestionRow | undefined;

    return row ? rowToQuestion(row) : null;
  }

  async findByMeetingAndStatus(
    meetingId: string,
    status: QuestionStatus,
    orderBy?: OrderBy
  ): Promise<Question[]> {
    const orderClause = buildOrderClause(orderBy);
    const rows = this.db
      .prepare(`SELECT * FROM questions WHERE meeting_id = ? AND status = ? ${orderClause}`)
      .all(meetingId, status) as QuestionRow[];

    return rows.map(rowToQuestion);
  }

  async create(question: Question, ipHash: string): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO questions (id, meeting_id, avatar_id, text, status, ip_hash, created_at, updated_at, selected_at, answered_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        question.id,
        question.meetingId,
        question.avatarId,
        question.text,
        question.status,
        ipHash,
        question.createdAt.toISOString(),
        question.updatedAt.toISOString(),
        question.selectedAt?.toISOString() ?? null,
        question.answeredAt?.toISOString() ?? null
      );
  }

  async update(question: Question): Promise<void> {
    this.db
      .prepare(
        `UPDATE questions SET
           status = ?,
           updated_at = ?,
           selected_at = ?,
           answered_at = ?
         WHERE id = ?`
      )
      .run(
        question.status,
        question.updatedAt.toISOString(),
        question.selectedAt?.toISOString() ?? null,
        question.answeredAt?.toISOString() ?? null,
        question.id
      );
  }

  async countRecentByIpHash(ipHash: string, windowMs: number): Promise<number> {
    const cutoff = new Date(Date.now() - windowMs).toISOString();
    const result = this.db
      .prepare('SELECT COUNT(*) as count FROM questions WHERE ip_hash = ? AND created_at > ?')
      .get(ipHash, cutoff) as { count: number };

    return result.count;
  }
}
