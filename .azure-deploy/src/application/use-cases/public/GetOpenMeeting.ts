import { IMeetingRepository } from '@/domain/ports/IMeetingRepository';
import { MeetingResponseDTO } from '@/application/dtos/MeetingResponseDTO';

export class GetOpenMeetingUseCase {
  constructor(private readonly meetingRepository: IMeetingRepository) {}

  async execute(): Promise<MeetingResponseDTO | null> {
    const meeting = await this.meetingRepository.findOpenForSubmissions();

    if (!meeting) {
      return null;
    }

    return {
      id: meeting.id,
      title: meeting.title,
      scheduledAt: meeting.scheduledAt.toISOString(),
      isOpenForSubmissions: meeting.isOpenForSubmissions,
    };
  }
}
