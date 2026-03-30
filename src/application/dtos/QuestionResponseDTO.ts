export interface QuestionResponseDTO {
  id: string;
  meetingId: string;
  avatarId: string;
  avatarDisplayName: string;
  avatarIcon: string;
  text: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  selectedAt: string | null;
  answeredAt: string | null;
}
