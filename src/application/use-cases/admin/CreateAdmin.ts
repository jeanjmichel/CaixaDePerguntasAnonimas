import { IAdminRepository } from '@/domain/ports/IAdminRepository';
import { IPasswordHasher } from '@/domain/ports/IPasswordHasher';
import { IIdGenerator } from '@/domain/ports/IIdGenerator';
import { Admin } from '@/domain/entities/Admin';
import { InputValidator } from '@/application/validation/InputValidator';
import { ApplicationError } from '@/application/errors/ApplicationError';
import { AdminResponseDTO } from '@/application/dtos/AdminResponseDTO';

export interface CreateAdminInput {
  username: string;
  password: string;
}

export class CreateAdminUseCase {
  constructor(
    private readonly adminRepository: IAdminRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(input: CreateAdminInput): Promise<AdminResponseDTO> {
    const usernameValidation = InputValidator.validateUsername(input.username);
    if (!usernameValidation.valid) {
      throw new ApplicationError(usernameValidation.error!, 'INVALID_INPUT');
    }

    const passwordValidation = InputValidator.validatePassword(input.password);
    if (!passwordValidation.valid) {
      throw new ApplicationError(passwordValidation.error!, 'INVALID_INPUT');
    }

    const existing = await this.adminRepository.findByUsername(input.username);
    if (existing) {
      throw new ApplicationError('Username already exists', 'USERNAME_ALREADY_EXISTS');
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const now = new Date();

    const admin = new Admin({
      id: this.idGenerator.generate(),
      username: input.username,
      passwordHash,
      mustChangePassword: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    await this.adminRepository.create(admin);

    return {
      id: admin.id,
      username: admin.username,
      mustChangePassword: admin.mustChangePassword,
      isActive: admin.isActive,
      createdAt: admin.createdAt.toISOString(),
    };
  }
}
