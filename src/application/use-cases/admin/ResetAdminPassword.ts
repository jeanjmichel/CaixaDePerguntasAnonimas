import { IAdminRepository } from '@/domain/ports/IAdminRepository';
import { IPasswordHasher } from '@/domain/ports/IPasswordHasher';
import { Admin } from '@/domain/entities/Admin';
import { InputValidator } from '@/application/validation/InputValidator';
import { ApplicationError } from '@/application/errors/ApplicationError';

export class ResetAdminPasswordUseCase {
  constructor(
    private readonly adminRepository: IAdminRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(adminId: string, requestingAdminId: string, newPassword: string): Promise<void> {
    if (adminId === requestingAdminId) {
      throw new ApplicationError('Cannot modify your own account', 'CANNOT_MODIFY_SELF');
    }

    const passwordValidation = InputValidator.validatePassword(newPassword);
    if (!passwordValidation.valid) {
      throw new ApplicationError(passwordValidation.error!, 'INVALID_INPUT');
    }

    const admin = await this.adminRepository.findById(adminId);
    if (!admin) {
      throw new ApplicationError('Admin not found', 'ADMIN_NOT_FOUND');
    }

    const newHash = await this.passwordHasher.hash(newPassword);

    const updated = new Admin({
      ...admin.toProps(),
      passwordHash: newHash,
      mustChangePassword: true,
      updatedAt: new Date(),
    });

    await this.adminRepository.update(updated);
  }
}
