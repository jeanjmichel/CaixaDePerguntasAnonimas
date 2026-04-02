import { Question } from '@/domain/entities/Question';
import { Avatar } from '@/domain/enums/Avatar';
import { QuestionResponseDTO } from '@/application/dtos/QuestionResponseDTO';

export function questionToDTO(question: Question): QuestionResponseDTO {
  const avatar = Avatar.findById(question.avatarId);

  return {
    id: question.id,
    meetingId: question.meetingId,
    avatarId: question.avatarId,
    avatarDisplayName: avatar?.displayName ?? question.avatarId,
    avatarIcon: avatar?.icon ?? '❓',
    text: question.text,
    status: question.status,
    createdAt: question.createdAt.toISOString(),
    updatedAt: question.updatedAt.toISOString(),
    selectedAt: question.selectedAt?.toISOString() ?? null,
    answeredAt: question.answeredAt?.toISOString() ?? null,
  };
}
