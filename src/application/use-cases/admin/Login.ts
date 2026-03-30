import { IAdminRepository } from '@/domain/ports/IAdminRepository';
import { IPasswordHasher } from '@/domain/ports/IPasswordHasher';
import { IJwtService } from '@/domain/ports/IJwtService';
import { InputValidator } from '@/application/validation/InputValidator';
import { ApplicationError } from '@/application/errors/ApplicationError';
import { LoginInput } from '@/application/dtos/LoginInput';
import { LoginOutput } from '@/application/dtos/LoginOutput';

export class LoginUseCase {
  constructor(
    private readonly adminRepository: IAdminRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly jwtService: IJwtService,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const usernameValidation = InputValidator.validateUsername(input.username);
    if (!usernameValidation.valid) {
      throw new ApplicationError('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const passwordValidation = InputValidator.validatePassword(input.password);
    if (!passwordValidation.valid) {
      throw new ApplicationError('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const admin = await this.adminRepository.findByUsername(input.username);
    if (!admin) {
      throw new ApplicationError('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    if (!admin.isActive) {
      throw new ApplicationError('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const passwordMatch = await this.passwordHasher.compare(input.password, admin.passwordHash);
    if (!passwordMatch) {
      throw new ApplicationError('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const token = this.jwtService.sign({
      adminId: admin.id,
      mustChangePassword: admin.mustChangePassword,
    });

    return {
      token,
      mustChangePassword: admin.mustChangePassword,
      admin: {
        id: admin.id,
        username: admin.username,
        mustChangePassword: admin.mustChangePassword,
        isActive: admin.isActive,
        createdAt: admin.createdAt.toISOString(),
      },
    };
  }
}
