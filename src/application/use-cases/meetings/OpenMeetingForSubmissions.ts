import { IMeetingRepository } from '@/domain/ports/IMeetingRepository';
import { ApplicationError } from '@/application/errors/ApplicationError';
import { MeetingResponseDTO } from '@/application/dtos/MeetingResponseDTO';
import { meetingToDTO } from './meetingMapper';

export class OpenMeetingForSubmissionsUseCase {
  constructor(
    private readonly meetingRepository: IMeetingRepository,
  ) {}

  async execute(meetingId: string): Promise<MeetingResponseDTO> {
    const meeting = await this.meetingRepository.findById(meetingId);
    if (!meeting) {
      throw new ApplicationError('Meeting not found', 'MEETING_NOT_FOUND');
    }

    await this.meetingRepository.closeAllOpen();

    const opened = meeting.open();
    await this.meetingRepository.update(opened);

    return meetingToDTO(opened);
  }
}
