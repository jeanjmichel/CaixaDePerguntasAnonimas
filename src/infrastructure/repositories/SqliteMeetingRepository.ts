import Database from 'better-sqlite3';
import { Meeting, MeetingProps } from '@/domain/entities/Meeting';
import { IMeetingRepository } from '@/domain/ports/IMeetingRepository';

interface MeetingRow {
  id: string;
  title: string;
  scheduled_at: string;
  is_open_for_submissions: number;
  opened_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

function rowToMeeting(row: MeetingRow): Meeting {
  return new Meeting({
    id: row.id,
    title: row.title,
    scheduledAt: new Date(row.scheduled_at),
    isOpenForSubmissions: row.is_open_for_submissions === 1,
    openedAt: row.opened_at ? new Date(row.opened_at) : null,
    closedAt: row.closed_at ? new Date(row.closed_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  });
}

function meetingToParams(meeting: Meeting) {
  return {
    id: meeting.id,
    title: meeting.title,
    scheduled_at: meeting.scheduledAt.toISOString(),
    is_open_for_submissions: meeting.isOpenForSubmissions ? 1 : 0,
    opened_at: meeting.openedAt?.toISOString() ?? null,
    closed_at: meeting.closedAt?.toISOString() ?? null,
    created_at: meeting.createdAt.toISOString(),
    updated_at: meeting.updatedAt.toISOString(),
  };
}

export class SqliteMeetingRepository implements IMeetingRepository {
  constructor(private readonly db: Database.Database) {}

  async findById(id: string): Promise<Meeting | null> {
    const row = this.db
      .prepare('SELECT * FROM meetings WHERE id = ?')
      .get(id) as MeetingRow | undefined;

    return row ? rowToMeeting(row) : null;
  }

  async findAll(): Promise<Meeting[]> {
    const rows = this.db
      .prepare('SELECT * FROM meetings ORDER BY scheduled_at DESC')
      .all() as MeetingRow[];

    return rows.map(rowToMeeting);
  }

  async findOpenForSubmissions(): Promise<Meeting | null> {
    const row = this.db
      .prepare('SELECT * FROM meetings WHERE is_open_for_submissions = 1 LIMIT 1')
      .get() as MeetingRow | undefined;

    return row ? rowToMeeting(row) : null;
  }

  async create(meeting: Meeting): Promise<void> {
    const params = meetingToParams(meeting);
    this.db
      .prepare(
        `INSERT INTO meetings (id, title, scheduled_at, is_open_for_submissions, opened_at, closed_at, created_at, updated_at)
         VALUES (@id, @title, @scheduled_at, @is_open_for_submissions, @opened_at, @closed_at, @created_at, @updated_at)`
      )
      .run(params);
  }

  async update(meeting: Meeting): Promise<void> {
    const params = meetingToParams(meeting);
    this.db
      .prepare(
        `UPDATE meetings SET
           title = @title,
           scheduled_at = @scheduled_at,
           is_open_for_submissions = @is_open_for_submissions,
           opened_at = @opened_at,
           closed_at = @closed_at,
           updated_at = @updated_at
         WHERE id = @id`
      )
      .run(params);
  }

  async closeAllOpen(): Promise<void> {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `UPDATE meetings SET
           is_open_for_submissions = 0,
           closed_at = @closed_at,
           updated_at = @updated_at
         WHERE is_open_for_submissions = 1`
      )
      .run({ closed_at: now, updated_at: now });
  }
}
