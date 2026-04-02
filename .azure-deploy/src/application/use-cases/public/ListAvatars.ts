import { Avatar } from '@/domain/enums/Avatar';
import { AvatarResponseDTO } from '@/application/dtos/AvatarResponseDTO';

export class ListAvatarsUseCase {
  execute(): AvatarResponseDTO[] {
    return Avatar.getAll().map((avatar) => ({
      id: avatar.id,
      displayName: avatar.displayName,
      icon: avatar.icon,
    }));
  }
}
