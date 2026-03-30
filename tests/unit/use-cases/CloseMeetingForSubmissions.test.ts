import { CloseMeetingForSubmissionsUseCase } from '@/application/use-cases/meetings/CloseMeetingForSubmissions';
import { IMeetingRepository } from '@/domain/ports/IMeetingRepository';
import { createMeeting, createOpenMeeting } from '../../helpers/factories';

describe('CloseMeetingForSubmissionsUseCase', () => {
  let useCase: CloseMeetingForSubmissionsUseCase;
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
    useCase = new CloseMeetingForSubmissionsUseCase(meetingRepository);
  });

  it('should close an open meeting', async () => {
    const meeting = createOpenMeeting({ id: 'meeting-1' });
    meetingRepository.findById.mockResolvedValue(meeting);

    const result = await useCase.execute('meeting-1');

    expect(result.isOpenForSubmissions).toBe(false);
    expect(result.id).toBe('meeting-1');
    expect(meetingRepository.update).toHaveBeenCalledTimes(1);
  });

  it('should be idempotent — return success for already closed meeting', async () => {
    const meeting = createMeeting({ id: 'meeting-2', isOpenForSubmissions: false });
    meetingRepository.findById.mockResolvedValue(meeting);

    const result = await useCase.execute('meeting-2');

    expect(result.isOpenForSubmissions).toBe(false);
    expect(result.id).toBe('meeting-2');
    expect(meetingRepository.update).not.toHaveBeenCalled();
  });

  it('should throw MEETING_NOT_FOUND when meeting does not exist', async () => {
    meetingRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('nonexistent')).rejects.toMatchObject({
      code: 'MEETING_NOT_FOUND',
    });
  });
});
