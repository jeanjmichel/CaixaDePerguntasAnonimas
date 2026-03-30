import { IMeetingRepository } from '@/domain/ports/IMeetingRepository';
import { IIdGenerator } from '@/domain/ports/IIdGenerator';
import { Meeting } from '@/domain/entities/Meeting';
import { InputValidator } from '@/application/validation/InputValidator';
import { ApplicationError } from '@/application/errors/ApplicationError';
import { CreateMeetingInput } from '@/application/dtos/CreateMeetingInput';
import { MeetingResponseDTO } from '@/application/dtos/MeetingResponseDTO';
import { meetingToDTO } from './meetingMapper';

export class CreateMeetingUseCase {
  constructor(
    private readonly meetingRepository: IMeetingRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(input: CreateMeetingInput): Promise<MeetingResponseDTO> {
    const titleValidation = InputValidator.validateMeetingTitle(input.title);
    if (!titleValidation.valid) {
      throw new ApplicationError(titleValidation.error!, 'INVALID_INPUT');
    }

    const dateValidation = InputValidator.validateScheduledAt(input.scheduledAt);
    if (!dateValidation.valid) {
      throw new ApplicationError(dateValidation.error!, 'INVALID_INPUT');
    }

    const now = new Date();
    const meeting = new Meeting({
      id: this.idGenerator.generate(),
      title: input.title.trim(),
      scheduledAt: new Date(input.scheduledAt),
      isOpenForSubmissions: false,
      openedAt: null,
      closedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    await this.meetingRepository.create(meeting);

    return meetingToDTO(meeting);
  }
}
