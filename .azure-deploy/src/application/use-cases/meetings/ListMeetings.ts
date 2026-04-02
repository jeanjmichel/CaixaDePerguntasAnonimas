import { IMeetingRepository } from '@/domain/ports/IMeetingRepository';
import { MeetingResponseDTO } from '@/application/dtos/MeetingResponseDTO';
import { meetingToDTO } from './meetingMapper';

export class ListMeetingsUseCase {
  constructor(
    private readonly meetingRepository: IMeetingRepository,
  ) {}

  async execute(): Promise<MeetingResponseDTO[]> {
    const meetings = await this.meetingRepository.findAll();
    return meetings.map(meetingToDTO);
  }
}
