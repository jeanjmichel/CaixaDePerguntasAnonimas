import { IAdminRepository } from '@/domain/ports/IAdminRepository';
import { IPasswordHasher } from '@/domain/ports/IPasswordHasher';
import { InputValidator } from '@/application/validation/InputValidator';
import { ApplicationError } from '@/application/errors/ApplicationError';
import { ChangePasswordInput } from '@/application/dtos/ChangePasswordInput';

export class ChangeOwnPasswordUseCase {
  constructor(
    private readonly adminRepository: IAdminRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(adminId: string, input: ChangePasswordInput): Promise<void> {
    const passwordValidation = InputValidator.validatePassword(input.newPassword);
    if (!passwordValidation.valid) {
      throw new ApplicationError(passwordValidation.error!, 'INVALID_INPUT');
    }

    const admin = await this.adminRepository.findById(adminId);
    if (!admin) {
      throw new ApplicationError('Admin not found', 'ADMIN_NOT_FOUND');
    }

    const oldPasswordMatch = await this.passwordHasher.compare(input.oldPassword, admin.passwordHash);
    if (!oldPasswordMatch) {
      throw new ApplicationError('Invalid current password', 'INVALID_CURRENT_PASSWORD');
    }

    const newHash = await this.passwordHasher.hash(input.newPassword);
    const updatedAdmin = admin.changePassword(newHash);
    await this.adminRepository.update(updatedAdmin);
  }
}
