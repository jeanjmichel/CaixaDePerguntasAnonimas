import { IMeetingRepository } from '@/domain/ports/IMeetingRepository';
import { InputValidator } from '@/application/validation/InputValidator';
import { ApplicationError } from '@/application/errors/ApplicationError';
import { UpdateMeetingInput } from '@/application/dtos/UpdateMeetingInput';
import { MeetingResponseDTO } from '@/application/dtos/MeetingResponseDTO';
import { meetingToDTO } from './meetingMapper';

export class UpdateMeetingUseCase {
  constructor(
    private readonly meetingRepository: IMeetingRepository,
  ) {}

  async execute(meetingId: string, input: UpdateMeetingInput): Promise<MeetingResponseDTO> {
    const titleValidation = InputValidator.validateMeetingTitle(input.title);
    if (!titleValidation.valid) {
      throw new ApplicationError(titleValidation.error!, 'INVALID_INPUT');
    }

    const dateValidation = InputValidator.validateScheduledAt(input.scheduledAt);
    if (!dateValidation.valid) {
      throw new ApplicationError(dateValidation.error!, 'INVALID_INPUT');
    }

    const meeting = await this.meetingRepository.findById(meetingId);
    if (!meeting) {
      throw new ApplicationError('Meeting not found', 'MEETING_NOT_FOUND');
    }

    const updated = meeting.updateDetails(input.title.trim(), new Date(input.scheduledAt));
    await this.meetingRepository.update(updated);

    return meetingToDTO(updated);
  }
}
