import { ListMeetingsUseCase } from '@/application/use-cases/meetings/ListMeetings';
import { IMeetingRepository } from '@/domain/ports/IMeetingRepository';
import { createMeeting, createOpenMeeting } from '../../helpers/factories';

describe('ListMeetingsUseCase', () => {
  let useCase: ListMeetingsUseCase;
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
    useCase = new ListMeetingsUseCase(meetingRepository);
  });

  it('should return empty array when no meetings exist', async () => {
    meetingRepository.findAll.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });

  it('should return DTOs for all meetings', async () => {
    const meetings = [
      createMeeting({ id: 'm1', title: 'Meeting 1' }),
      createOpenMeeting({ id: 'm2', title: 'Meeting 2' }),
    ];
    meetingRepository.findAll.mockResolvedValue(meetings);

    const result = await useCase.execute();

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('m1');
    expect(result[0].isOpenForSubmissions).toBe(false);
    expect(result[1].id).toBe('m2');
    expect(result[1].isOpenForSubmissions).toBe(true);
  });
});
