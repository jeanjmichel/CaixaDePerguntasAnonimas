import { ListAdminsUseCase } from '@/application/use-cases/admin/ListAdmins';
import { IAdminRepository } from '@/domain/ports/IAdminRepository';
import { createAdmin } from '../../helpers/factories';

describe('ListAdminsUseCase', () => {
  let useCase: ListAdminsUseCase;
  let adminRepository: jest.Mocked<IAdminRepository>;

  beforeEach(() => {
    adminRepository = {
      findById: jest.fn(),
      findByUsername: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    useCase = new ListAdminsUseCase(adminRepository);
  });

  it('should return all admins as DTOs without passwordHash', async () => {
    const admins = [
      createAdmin({ id: 'a1', username: 'admin1' }),
      createAdmin({ id: 'a2', username: 'admin2' }),
    ];
    adminRepository.findAll.mockResolvedValue(admins);

    const result = await useCase.execute();

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('a1');
    expect(result[0].username).toBe('admin1');
    expect(result[1].id).toBe('a2');
    expect(result[1].username).toBe('admin2');
    result.forEach((dto) => {
      expect(dto).not.toHaveProperty('passwordHash');
      expect(typeof dto.createdAt).toBe('string');
    });
  });

  it('should return empty array when no admins exist', async () => {
    adminRepository.findAll.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });

  it('should map isActive and mustChangePassword correctly', async () => {
    const admins = [
      createAdmin({ isActive: false, mustChangePassword: true }),
    ];
    adminRepository.findAll.mockResolvedValue(admins);

    const result = await useCase.execute();

    expect(result[0].isActive).toBe(false);
    expect(result[0].mustChangePassword).toBe(true);
  });
});
