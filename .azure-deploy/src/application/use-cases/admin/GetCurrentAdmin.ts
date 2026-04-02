import { IAdminRepository } from '@/domain/ports/IAdminRepository';
import { ApplicationError } from '@/application/errors/ApplicationError';
import { AdminResponseDTO } from '@/application/dtos/AdminResponseDTO';

export class GetCurrentAdminUseCase {
  constructor(private readonly adminRepository: IAdminRepository) {}

  async execute(adminId: string): Promise<AdminResponseDTO> {
    const admin = await this.adminRepository.findById(adminId);
    if (!admin) {
      throw new ApplicationError('Admin not found', 'ADMIN_NOT_FOUND');
    }

    return {
      id: admin.id,
      username: admin.username,
      mustChangePassword: admin.mustChangePassword,
      isActive: admin.isActive,
      createdAt: admin.createdAt.toISOString(),
    };
  }
}
