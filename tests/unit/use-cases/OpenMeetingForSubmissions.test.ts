import { OpenMeetingForSubmissionsUseCase } from '@/application/use-cases/meetings/OpenMeetingForSubmissions';
import { IMeetingRepository } from '@/domain/ports/IMeetingRepository';
import { ApplicationError } from '@/application/errors/ApplicationError';
import { createMeeting, createOpenMeeting } from '../../helpers/factories';

describe('OpenMeetingForSubmissionsUseCase', () => {
  let useCase: OpenMeetingForSubmissionsUseCase;
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
    useCase = new OpenMeetingForSubmissionsUseCase(meetingRepository);
  });

  it('should open a closed meeting for submissions', async () => {
    const meeting = createMeeting({ id: 'meeting-1', isOpenForSubmissions: false });
    meetingRepository.findById.mockResolvedValue(meeting);

    const result = await useCase.execute('meeting-1');

    expect(result.isOpenForSubmissions).toBe(true);
    expect(result.id).toBe('meeting-1');
    expect(meetingRepository.closeAllOpen).toHaveBeenCalledTimes(1);
    expect(meetingRepository.update).toHaveBeenCalledTimes(1);
  });

  it('should close all other open meetings before opening', async () => {
    const callOrder: string[] = [];
    meetingRepository.closeAllOpen.mockImplementation(async () => { callOrder.push('closeAllOpen'); });
    meetingRepository.update.mockImplementation(async () => { callOrder.push('update'); });

    const meeting = createMeeting({ id: 'meeting-2', isOpenForSubmissions: false });
    meetingRepository.findById.mockResolvedValue(meeting);

    await useCase.execute('meeting-2');

    expect(callOrder).toEqual(['closeAllOpen', 'update']);
  });

  it('should throw MEETING_NOT_FOUND when meeting does not exist', async () => {
    meetingRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('nonexistent')).rejects.toMatchObject({
      code: 'MEETING_NOT_FOUND',
    });

    expect(meetingRepository.closeAllOpen).not.toHaveBeenCalled();
  });

  it('should open an already open meeting (re-open)', async () => {
    const meeting = createOpenMeeting({ id: 'meeting-3' });
    meetingRepository.findById.mockResolvedValue(meeting);

    const result = await useCase.execute('meeting-3');

    expect(result.isOpenForSubmissions).toBe(true);
    expect(meetingRepository.closeAllOpen).toHaveBeenCalledTimes(1);
  });
});
