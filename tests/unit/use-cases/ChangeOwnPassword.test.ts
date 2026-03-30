import { ChangeOwnPasswordUseCase } from '@/application/use-cases/admin/ChangeOwnPassword';
import { ApplicationError } from '@/application/errors/ApplicationError';
import { IAdminRepository } from '@/domain/ports/IAdminRepository';
import { IPasswordHasher } from '@/domain/ports/IPasswordHasher';
import { createAdmin } from '../../helpers/factories';

describe('ChangeOwnPasswordUseCase', () => {
  let useCase: ChangeOwnPasswordUseCase;
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
      hash: jest.fn().mockResolvedValue('$2a$12$newhashnewhashnewhash'),
      compare: jest.fn(),
    };

    useCase = new ChangeOwnPasswordUseCase(adminRepository, passwordHasher);
  });

  it('should change password successfully and set mustChangePassword to false', async () => {
    const admin = createAdmin({ mustChangePassword: true });
    adminRepository.findById.mockResolvedValue(admin);
    passwordHasher.compare.mockResolvedValue(true);

    await useCase.execute(admin.id, {
      oldPassword: 'oldpass123',
      newPassword: 'newpass123',
    });

    expect(passwordHasher.hash).toHaveBeenCalledWith('newpass123');
    expect(adminRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        mustChangePassword: false,
        passwordHash: '$2a$12$newhashnewhashnewhash',
      }),
    );
  });

  it('should throw INVALID_CURRENT_PASSWORD when old password is wrong', async () => {
    const admin = createAdmin();
    adminRepository.findById.mockResolvedValue(admin);
    passwordHasher.compare.mockResolvedValue(false);

    await expect(
      useCase.execute(admin.id, {
        oldPassword: 'wrongpass1',
        newPassword: 'newpass123',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_CURRENT_PASSWORD' });

    expect(adminRepository.update).not.toHaveBeenCalled();
  });

  it('should throw ADMIN_NOT_FOUND when admin does not exist', async () => {
    adminRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('nonexistent', {
        oldPassword: 'oldpass123',
        newPassword: 'newpass123',
      }),
    ).rejects.toMatchObject({ code: 'ADMIN_NOT_FOUND' });
  });

  it('should throw INVALID_INPUT when new password is too short', async () => {
    await expect(
      useCase.execute('any-id', {
        oldPassword: 'oldpass123',
        newPassword: 'short',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });

    expect(adminRepository.findById).not.toHaveBeenCalled();
  });

  it('should throw INVALID_INPUT when new password is too long', async () => {
    const longPassword = 'a'.repeat(129);

    await expect(
      useCase.execute('any-id', {
        oldPassword: 'oldpass123',
        newPassword: longPassword,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });

    expect(adminRepository.findById).not.toHaveBeenCalled();
  });
});
