import { UpdateMeetingUseCase } from '@/application/use-cases/meetings/UpdateMeeting';
import { IMeetingRepository } from '@/domain/ports/IMeetingRepository';
import { ApplicationError } from '@/application/errors/ApplicationError';
import { createMeeting } from '../../helpers/factories';

describe('UpdateMeetingUseCase', () => {
  let useCase: UpdateMeetingUseCase;
  let meetingRepository: jest.Mocked<IMeetingRepository>;

  beforeEach(() => {
    meetingRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findOpenForSubmissions: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      closeAllOpen: jest.fn(),
    };
    useCase = new UpdateMeetingUseCase(meetingRepository);
  });

  it('should update meeting title and scheduledAt', async () => {
    const meeting = createMeeting({ id: 'meeting-1', title: 'Old Title' });
    meetingRepository.findById.mockResolvedValue(meeting);

    const newDate = new Date(Date.now() + 86400000).toISOString();
    const result = await useCase.execute('meeting-1', {
      title: 'New Title',
      scheduledAt: newDate,
    });

    expect(result.title).toBe('New Title');
    expect(meetingRepository.update).toHaveBeenCalledTimes(1);
  });

  it('should throw MEETING_NOT_FOUND when meeting does not exist', async () => {
    meetingRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('nonexistent', {
        title: 'Title',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      }),
    ).rejects.toMatchObject({ code: 'MEETING_NOT_FOUND' });
  });

  it('should throw INVALID_INPUT for empty title', async () => {
    await expect(
      useCase.execute('meeting-1', {
        title: '',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });

    expect(meetingRepository.findById).not.toHaveBeenCalled();
  });

  it('should throw INVALID_INPUT for invalid scheduledAt', async () => {
    await expect(
      useCase.execute('meeting-1', {
        title: 'Valid Title',
        scheduledAt: 'not-a-date',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });

    expect(meetingRepository.findById).not.toHaveBeenCalled();
  });
});
