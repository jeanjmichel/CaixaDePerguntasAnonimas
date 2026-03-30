export interface MeetingResponseDTO {
  id: string;
  title: string;
  scheduledAt: string;
  isOpenForSubmissions: boolean;
  openedAt?: string | null;
  closedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
