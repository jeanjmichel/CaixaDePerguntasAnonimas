'use client';

import { Avatar } from '@/domain/enums/Avatar';
import { AvatarIcon } from '@/interface/components/shared/AvatarIcon';
import styles from './SuccessMessage.module.css';

interface SuccessMessageProps {
  avatarId: string;
  onSendAnother: () => void;
}

export function SuccessMessage({ avatarId, onSendAnother }: SuccessMessageProps) {
  const avatar = Avatar.findById(avatarId);

  return (
    <div className={styles.container} role="status">
      <span className={styles.icon}>✅</span>
      <h2 className={styles.title}>Pergunta enviada com sucesso!</h2>

      {avatar && (
        <div className={styles.avatarInfo}>
          <AvatarIcon avatarId={avatarId} size="sm" />
          <span>Enviada como {avatar.displayName}</span>
        </div>
      )}

      <p className={styles.note}>
        Sua pergunta é anônima. Ninguém saberá quem enviou.
      </p>

      <button type="button" className={styles.button} onClick={onSendAnother}>
        Enviar outra pergunta
      </button>
    </div>
  );
}
