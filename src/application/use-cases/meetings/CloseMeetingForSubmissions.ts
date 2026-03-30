import { IMeetingRepository } from '@/domain/ports/IMeetingRepository';
import { ApplicationError } from '@/application/errors/ApplicationError';
import { MeetingResponseDTO } from '@/application/dtos/MeetingResponseDTO';
import { meetingToDTO } from './meetingMapper';

export class CloseMeetingForSubmissionsUseCase {
  constructor(
    private readonly meetingRepository: IMeetingRepository,
  ) {}

  async execute(meetingId: string): Promise<MeetingResponseDTO> {
    const meeting = await this.meetingRepository.findById(meetingId);
    if (!meeting) {
      throw new ApplicationError('Meeting not found', 'MEETING_NOT_FOUND');
    }

    if (!meeting.isOpenForSubmissions) {
      return meetingToDTO(meeting);
    }

    const closed = meeting.close();
    await this.meetingRepository.update(closed);

    return meetingToDTO(closed);
  }
}
