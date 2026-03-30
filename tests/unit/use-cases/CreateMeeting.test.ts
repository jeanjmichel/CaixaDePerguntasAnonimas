import { CreateMeetingUseCase } from '@/application/use-cases/meetings/CreateMeeting';
import { IMeetingRepository } from '@/domain/ports/IMeetingRepository';
import { IIdGenerator } from '@/domain/ports/IIdGenerator';
import { ApplicationError } from '@/application/errors/ApplicationError';

describe('CreateMeetingUseCase', () => {
  let useCase: CreateMeetingUseCase;
  let meetingRepository: jest.Mocked<IMeetingRepository>;
  let idGenerator: jest.Mocked<IIdGenerator>;

  beforeEach(() => {
    meetingRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findOpenForSubmissions: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      closeAllOpen: jest.fn(),
    };
    idGenerator = {
      generate: jest.fn().mockReturnValue('generated-id'),
    };
    useCase = new CreateMeetingUseCase(meetingRepository, idGenerator);
  });

  it('should create a meeting and return DTO', async () => {
    const result = await useCase.execute({
      title: 'Sprint Planning',
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    });

    expect(result.id).toBe('generated-id');
    expect(result.title).toBe('Sprint Planning');
    expect(result.isOpenForSubmissions).toBe(false);
    expect(meetingRepository.create).toHaveBeenCalledTimes(1);
  });

  it('should trim the title', async () => {
    const result = await useCase.execute({
      title: '  Sprint Planning  ',
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    });

    expect(result.title).toBe('Sprint Planning');
  });

  it('should throw INVALID_INPUT for empty title', async () => {
    await expect(
      useCase.execute({ title: '', scheduledAt: new Date(Date.now() + 86400000).toISOString() }),
    ).rejects.toThrow(ApplicationError);

    await expect(
      useCase.execute({ title: '', scheduledAt: new Date(Date.now() + 86400000).toISOString() }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  });

  it('should throw INVALID_INPUT for title exceeding max length', async () => {
    const longTitle = 'A'.repeat(201);
    await expect(
      useCase.execute({ title: longTitle, scheduledAt: new Date(Date.now() + 86400000).toISOString() }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  });

  it('should throw INVALID_INPUT for invalid scheduledAt', async () => {
    await expect(
      useCase.execute({ title: 'Valid Title', scheduledAt: 'not-a-date' }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  });

  it('should throw INVALID_INPUT for empty scheduledAt', async () => {
    await expect(
      useCase.execute({ title: 'Valid Title', scheduledAt: '' }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  });
});
