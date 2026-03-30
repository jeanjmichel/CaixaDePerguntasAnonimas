import { GetCurrentAdminUseCase } from '@/application/use-cases/admin/GetCurrentAdmin';
import { ApplicationError } from '@/application/errors/ApplicationError';
import { IAdminRepository } from '@/domain/ports/IAdminRepository';
import { createAdmin } from '../../helpers/factories';

describe('GetCurrentAdminUseCase', () => {
  let useCase: GetCurrentAdminUseCase;
  let adminRepository: jest.Mocked<IAdminRepository>;

  beforeEach(() => {
    adminRepository = {
      findById: jest.fn(),
      findByUsername: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    useCase = new GetCurrentAdminUseCase(adminRepository);
  });

  it('should return AdminResponseDTO without passwordHash', async () => {
    const admin = createAdmin({ username: 'myadmin' });
    adminRepository.findById.mockResolvedValue(admin);

    const result = await useCase.execute(admin.id);

    expect(result.id).toBe(admin.id);
    expect(result.username).toBe('myadmin');
    expect(result.isActive).toBe(true);
    expect(typeof result.createdAt).toBe('string');
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('should throw ADMIN_NOT_FOUND when admin does not exist', async () => {
    adminRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('nonexistent'),
    ).rejects.toMatchObject({ code: 'ADMIN_NOT_FOUND' });
  });
});
