import { Meeting } from '../entities/Meeting';

export interface IMeetingRepository {
  findById(id: string): Promise<Meeting | null>;
  findAll(): Promise<Meeting[]>;
  findOpenForSubmissions(): Promise<Meeting | null>;
  create(meeting: Meeting): Promise<void>;
  update(meeting: Meeting): Promise<void>;
  closeAllOpen(): Promise<void>;
}
