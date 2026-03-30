import { IAdminRepository } from '@/domain/ports/IAdminRepository';
import { ApplicationError } from '@/application/errors/ApplicationError';
import { AdminResponseDTO } from '@/application/dtos/AdminResponseDTO';

export class ToggleAdminActiveUseCase {
  constructor(private readonly adminRepository: IAdminRepository) {}

  async execute(adminId: string, requestingAdminId: string): Promise<AdminResponseDTO> {
    if (adminId === requestingAdminId) {
      throw new ApplicationError('Cannot modify your own account', 'CANNOT_MODIFY_SELF');
    }

    const admin = await this.adminRepository.findById(adminId);
    if (!admin) {
      throw new ApplicationError('Admin not found', 'ADMIN_NOT_FOUND');
    }

    const toggled = admin.toggleActive(!admin.isActive);
    await this.adminRepository.update(toggled);

    return {
      id: toggled.id,
      username: toggled.username,
      mustChangePassword: toggled.mustChangePassword,
      isActive: toggled.isActive,
      createdAt: toggled.createdAt.toISOString(),
    };
  }
}
