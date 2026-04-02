import { Meeting } from '@/domain/entities/Meeting';
import { MeetingResponseDTO } from '@/application/dtos/MeetingResponseDTO';

export function meetingToDTO(meeting: Meeting): MeetingResponseDTO {
  return {
    id: meeting.id,
    title: meeting.title,
    scheduledAt: meeting.scheduledAt.toISOString(),
    isOpenForSubmissions: meeting.isOpenForSubmissions,
    openedAt: meeting.openedAt?.toISOString() ?? null,
    closedAt: meeting.closedAt?.toISOString() ?? null,
    createdAt: meeting.createdAt.toISOString(),
    updatedAt: meeting.updatedAt.toISOString(),
  };
}
