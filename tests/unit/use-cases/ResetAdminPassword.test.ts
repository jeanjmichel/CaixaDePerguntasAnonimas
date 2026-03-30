import { ResetAdminPasswordUseCase } from '@/application/use-cases/admin/ResetAdminPassword';
import { ApplicationError } from '@/application/errors/ApplicationError';
import { IAdminRepository } from '@/domain/ports/IAdminRepository';
import { IPasswordHasher } from '@/domain/ports/IPasswordHasher';
import { createAdmin } from '../../helpers/factories';

describe('ResetAdminPasswordUseCase', () => {
  let useCase: ResetAdminPasswordUseCase;
  let adminRepository: jest.Mocked<IAdminRepository>;
  let passwordHasher: jest.Mocked<IPasswordHasher>;

  beforeEach(() => {
    adminRepository = {
      findById: jest.fn(),
      findByUsername: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    passwordHasher = {
      hash: jest.fn().mockResolvedValue('$2a$12$newhashedpassword'),
      compare: jest.fn(),
    };

    useCase = new ResetAdminPasswordUseCase(adminRepository, passwordHasher);
  });

  it('should reset password and set mustChangePassword to true', async () => {
    const admin = createAdmin({ id: 'target-id', mustChangePassword: false });
    adminRepository.findById.mockResolvedValue(admin);

    await useCase.execute('target-id', 'requester-id', 'newpassword123');

    expect(passwordHasher.hash).toHaveBeenCalledWith('newpassword123');
    expect(adminRepository.update).toHaveBeenCalled();
    const updatedAdmin = adminRepository.update.mock.calls[0][0];
    expect(updatedAdmin.passwordHash).toBe('$2a$12$newhashedpassword');
    expect(updatedAdmin.mustChangePassword).toBe(true);
  });

  it('should throw CANNOT_MODIFY_SELF when trying to reset own password', async () => {
    await expect(
      useCase.execute('same-id', 'same-id', 'newpassword123'),
    ).rejects.toMatchObject({ code: 'CANNOT_MODIFY_SELF' });

    expect(adminRepository.findById).not.toHaveBeenCalled();
  });

  it('should throw ADMIN_NOT_FOUND when admin does not exist', async () => {
    adminRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('nonexistent', 'requester-id', 'newpassword123'),
    ).rejects.toMatchObject({ code: 'ADMIN_NOT_FOUND' });

    expect(adminRepository.update).not.toHaveBeenCalled();
  });

  it('should throw INVALID_INPUT for password shorter than 8 characters', async () => {
    await expect(
      useCase.execute('target-id', 'requester-id', 'short'),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });

    expect(adminRepository.findById).not.toHaveBeenCalled();
  });

  it('should hash the new password before persisting', async () => {
    const admin = createAdmin({ id: 'target-id' });
    adminRepository.findById.mockResolvedValue(admin);

    await useCase.execute('target-id', 'requester-id', 'newsecurepassword');

    expect(passwordHasher.hash).toHaveBeenCalledWith('newsecurepassword');
    const updatedAdmin = adminRepository.update.mock.calls[0][0];
    expect(updatedAdmin.passwordHash).toBe('$2a$12$newhashedpassword');
  });
});
