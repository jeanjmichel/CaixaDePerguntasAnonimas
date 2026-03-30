import { GetOpenMeetingUseCase } from '@/application/use-cases/public/GetOpenMeeting';
import { IMeetingRepository } from '@/domain/ports/IMeetingRepository';
import { createOpenMeeting } from '../../helpers/factories';

describe('GetOpenMeetingUseCase', () => {
  let useCase: GetOpenMeetingUseCase;
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
    useCase = new GetOpenMeetingUseCase(meetingRepository);
  });

  it('should return MeetingResponseDTO when a meeting is open', async () => {
    const meeting = createOpenMeeting({ title: 'Townhall Q1' });
    meetingRepository.findOpenForSubmissions.mockResolvedValue(meeting);

    const result = await useCase.execute();

    expect(result).not.toBeNull();
    expect(result!.id).toBe(meeting.id);
    expect(result!.title).toBe('Townhall Q1');
    expect(result!.isOpenForSubmissions).toBe(true);
    expect(typeof result!.scheduledAt).toBe('string');
  });

  it('should return null when no meeting is open', async () => {
    meetingRepository.findOpenForSubmissions.mockResolvedValue(null);

    const result = await useCase.execute();

    expect(result).toBeNull();
  });
});
