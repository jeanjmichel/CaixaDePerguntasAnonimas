import { Avatar } from '@/domain/enums/Avatar';
import styles from './AvatarIcon.module.css';

interface AvatarIconProps {
  avatarId: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarIcon({ avatarId, size = 'md' }: AvatarIconProps) {
  const avatar = Avatar.findById(avatarId);
  const icon = avatar?.icon ?? '❓';
  const label = avatar?.displayName ?? avatarId;

  return (
    <span
      className={`${styles.avatar} ${styles[size]}`}
      role="img"
      aria-label={label}
      title={label}
    >
      {icon}
    </span>
  );
}
