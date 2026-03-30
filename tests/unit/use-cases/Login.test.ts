import { LoginUseCase } from '@/application/use-cases/admin/Login';
import { ApplicationError } from '@/application/errors/ApplicationError';
import { IAdminRepository } from '@/domain/ports/IAdminRepository';
import { IPasswordHasher } from '@/domain/ports/IPasswordHasher';
import { IJwtService } from '@/domain/ports/IJwtService';
import { createAdmin } from '../../helpers/factories';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let adminRepository: jest.Mocked<IAdminRepository>;
  let passwordHasher: jest.Mocked<IPasswordHasher>;
  let jwtService: jest.Mocked<IJwtService>;

  beforeEach(() => {
    adminRepository = {
      findById: jest.fn(),
      findByUsername: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    passwordHasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('test-jwt-token'),
      verify: jest.fn(),
      getCookieConfig: jest.fn(),
      getClearCookieConfig: jest.fn(),
    };

    useCase = new LoginUseCase(adminRepository, passwordHasher, jwtService);
  });

  it('should login successfully and return token with admin data', async () => {
    const admin = createAdmin({ username: 'admin', mustChangePassword: true });
    adminRepository.findByUsername.mockResolvedValue(admin);
    passwordHasher.compare.mockResolvedValue(true);

    const result = await useCase.execute({ username: 'admin', password: 'validpass1' });

    expect(result.token).toBe('test-jwt-token');
    expect(result.mustChangePassword).toBe(true);
    expect(result.admin.id).toBe(admin.id);
    expect(result.admin.username).toBe('admin');
    expect(result.admin).not.toHaveProperty('passwordHash');
    expect(jwtService.sign).toHaveBeenCalledWith({
      adminId: admin.id,
      mustChangePassword: true,
    });
  });

  it('should throw INVALID_CREDENTIALS when username not found', async () => {
    adminRepository.findByUsername.mockResolvedValue(null);

    await expect(
      useCase.execute({ username: 'unknown', password: 'validpass1' }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });

    expect(passwordHasher.compare).not.toHaveBeenCalled();
  });

  it('should throw INVALID_CREDENTIALS when password is wrong', async () => {
    const admin = createAdmin();
    adminRepository.findByUsername.mockResolvedValue(admin);
    passwordHasher.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({ username: 'testadmin', password: 'wrongpass1' }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });

    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it('should throw INVALID_CREDENTIALS when admin is inactive', async () => {
    const admin = createAdmin({ isActive: false });
    adminRepository.findByUsername.mockResolvedValue(admin);

    await expect(
      useCase.execute({ username: 'testadmin', password: 'validpass1' }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });

    expect(passwordHasher.compare).not.toHaveBeenCalled();
  });

  it('should throw INVALID_CREDENTIALS for empty username', async () => {
    await expect(
      useCase.execute({ username: '', password: 'validpass1' }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });

    expect(adminRepository.findByUsername).not.toHaveBeenCalled();
  });

  it('should throw INVALID_CREDENTIALS for empty password', async () => {
    await expect(
      useCase.execute({ username: 'admin', password: '' }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });

    expect(adminRepository.findByUsername).not.toHaveBeenCalled();
  });
});
