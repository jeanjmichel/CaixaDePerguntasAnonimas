import { ToggleAdminActiveUseCase } from '@/application/use-cases/admin/ToggleAdminActive';
import { ApplicationError } from '@/application/errors/ApplicationError';
import { IAdminRepository } from '@/domain/ports/IAdminRepository';
import { createAdmin } from '../../helpers/factories';

describe('ToggleAdminActiveUseCase', () => {
  let useCase: ToggleAdminActiveUseCase;
  let adminRepository: jest.Mocked<IAdminRepository>;

  beforeEach(() => {
    adminRepository = {
      findById: jest.fn(),
      findByUsername: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    useCase = new ToggleAdminActiveUseCase(adminRepository);
  });

  it('should deactivate an active admin', async () => {
    const admin = createAdmin({ id: 'target-id', isActive: true });
    adminRepository.findById.mockResolvedValue(admin);

    const result = await useCase.execute('target-id', 'requester-id');

    expect(result.isActive).toBe(false);
    expect(adminRepository.update).toHaveBeenCalled();
    const updatedAdmin = adminRepository.update.mock.calls[0][0];
    expect(updatedAdmin.isActive).toBe(false);
  });

  it('should activate an inactive admin', async () => {
    const admin = createAdmin({ id: 'target-id', isActive: false });
    adminRepository.findById.mockResolvedValue(admin);

    const result = await useCase.execute('target-id', 'requester-id');

    expect(result.isActive).toBe(true);
    expect(adminRepository.update).toHaveBeenCalled();
    const updatedAdmin = adminRepository.update.mock.calls[0][0];
    expect(updatedAdmin.isActive).toBe(true);
  });

  it('should throw ADMIN_NOT_FOUND when admin does not exist', async () => {
    adminRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('nonexistent', 'requester-id'),
    ).rejects.toMatchObject({ code: 'ADMIN_NOT_FOUND' });

    expect(adminRepository.update).not.toHaveBeenCalled();
  });

  it('should throw CANNOT_MODIFY_SELF when trying to toggle own status', async () => {
    await expect(
      useCase.execute('same-id', 'same-id'),
    ).rejects.toMatchObject({ code: 'CANNOT_MODIFY_SELF' });

    expect(adminRepository.findById).not.toHaveBeenCalled();
  });

  it('should return AdminResponseDTO without passwordHash', async () => {
    const admin = createAdmin({ id: 'target-id' });
    adminRepository.findById.mockResolvedValue(admin);

    const result = await useCase.execute('target-id', 'requester-id');

    expect(result).not.toHaveProperty('passwordHash');
    expect(typeof result.createdAt).toBe('string');
  });
});
