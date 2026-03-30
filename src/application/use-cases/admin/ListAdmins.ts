import { IAdminRepository } from '@/domain/ports/IAdminRepository';
import { AdminResponseDTO } from '@/application/dtos/AdminResponseDTO';

export class ListAdminsUseCase {
  constructor(private readonly adminRepository: IAdminRepository) {}

  async execute(): Promise<AdminResponseDTO[]> {
    const admins = await this.adminRepository.findAll();

    return admins.map((admin) => ({
      id: admin.id,
      username: admin.username,
      mustChangePassword: admin.mustChangePassword,
      isActive: admin.isActive,
      createdAt: admin.createdAt.toISOString(),
    }));
  }
}
