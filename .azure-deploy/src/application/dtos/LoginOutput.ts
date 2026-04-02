import { AdminResponseDTO } from './AdminResponseDTO';

export interface LoginOutput {
  token: string;
  mustChangePassword: boolean;
  admin: AdminResponseDTO;
}
