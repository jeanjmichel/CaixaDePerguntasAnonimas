'use client';

import type { AvatarResponseDTO } from '@/application/dtos/AvatarResponseDTO';
import { AvatarIcon } from '@/interface/components/shared/AvatarIcon';
import styles from './AvatarSelector.module.css';

interface AvatarSelectorProps {
  avatars: AvatarResponseDTO[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export function AvatarSelector({ avatars, selectedId, onSelect, disabled }: AvatarSelectorProps) {
  return (
    <div>
      <p className={styles.hint}>
        Escolha um avatar ou deixe em branco para um aleatório
      </p>
      <div className={styles.grid} role="radiogroup" aria-label="Selecione um avatar">
        {avatars.map((avatar) => (
          <button
            key={avatar.id}
            type="button"
            role="radio"
            aria-checked={selectedId === avatar.id}
            aria-label={avatar.displayName}
            className={`${styles.item} ${selectedId === avatar.id ? styles.selected : ''}`}
            onClick={() => onSelect(avatar.id)}
            disabled={disabled}
          >
            <AvatarIcon avatarId={avatar.id} size="md" />
            <span className={styles.name}>{avatar.displayName}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
