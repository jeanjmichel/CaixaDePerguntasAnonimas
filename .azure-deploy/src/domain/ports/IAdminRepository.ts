import { Admin } from '../entities/Admin';

export interface IAdminRepository {
  findById(id: string): Promise<Admin | null>;
  findByUsername(username: string): Promise<Admin | null>;
  findAll(): Promise<Admin[]>;
  create(admin: Admin): Promise<void>;
  update(admin: Admin): Promise<void>;
}
