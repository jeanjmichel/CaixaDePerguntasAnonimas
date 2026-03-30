import { CreateAdminUseCase } from '@/application/use-cases/admin/CreateAdmin';
import { ApplicationError } from '@/application/errors/ApplicationError';
import { IAdminRepository } from '@/domain/ports/IAdminRepository';
import { IPasswordHasher } from '@/domain/ports/IPasswordHasher';
import { IIdGenerator } from '@/domain/ports/IIdGenerator';
import { createAdmin } from '../../helpers/factories';

describe('CreateAdminUseCase', () => {
  let useCase: CreateAdminUseCase;
  let adminRepository: jest.Mocked<IAdminRepository>;
  let passwordHasher: jest.Mocked<IPasswordHasher>;
  let idGenerator: jest.Mocked<IIdGenerator>;

  beforeEach(() => {
    adminRepository = {
      findById: jest.fn(),
      findByUsername: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    passwordHasher = {
      hash: jest.fn().mockResolvedValue('$2a$12$hashedpassword'),
      compare: jest.fn(),
    };
    idGenerator = {
      generate: jest.fn().mockReturnValue('generated-id'),
    };

    useCase = new CreateAdminUseCase(adminRepository, passwordHasher, idGenerator);
  });

  it('should create admin successfully with mustChangePassword=true and isActive=true', async () => {
    adminRepository.findByUsername.mockResolvedValue(null);

    const result = await useCase.execute({ username: 'newadmin', password: 'securepass123' });

    expect(result.id).toBe('generated-id');
    expect(result.username).toBe('newadmin');
    expect(result.mustChangePassword).toBe(true);
    expect(result.isActive).toBe(true);
    expect(result).not.toHaveProperty('passwordHash');
    expect(passwordHasher.hash).toHaveBeenCalledWith('securepass123');
    expect(adminRepository.create).toHaveBeenCalled();
  });

  it('should throw INVALID_INPUT for username shorter than 3 characters', async () => {
    await expect(
      useCase.execute({ username: 'ab', password: 'securepass123' }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });

    expect(adminRepository.findByUsername).not.toHaveBeenCalled();
  });

  it('should throw INVALID_INPUT for invalid username characters', async () => {
    await expect(
      useCase.execute({ username: 'bad user!', password: 'securepass123' }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  });

  it('should throw INVALID_INPUT for password shorter than 8 characters', async () => {
    await expect(
      useCase.execute({ username: 'validuser', password: 'short' }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });

    expect(adminRepository.findByUsername).not.toHaveBeenCalled();
  });

  it('should throw USERNAME_ALREADY_EXISTS when username is taken', async () => {
    adminRepository.findByUsername.mockResolvedValue(createAdmin({ username: 'existing' }));

    await expect(
      useCase.execute({ username: 'existing', password: 'securepass123' }),
    ).rejects.toMatchObject({ code: 'USERNAME_ALREADY_EXISTS' });

    expect(adminRepository.create).not.toHaveBeenCalled();
  });

  it('should return AdminResponseDTO with createdAt as ISO string', async () => {
    adminRepository.findByUsername.mockResolvedValue(null);

    const result = await useCase.execute({ username: 'newadmin', password: 'securepass123' });

    expect(typeof result.createdAt).toBe('string');
    expect(() => new Date(result.createdAt)).not.toThrow();
  });
});
