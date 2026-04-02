'use client';

import type { AdminResponseDTO } from '@/application/dtos/AdminResponseDTO';
import styles from './AdminList.module.css';

interface AdminListProps {
  admins: AdminResponseDTO[];
  currentAdminId: string;
  onToggleActive: (admin: AdminResponseDTO) => void;
  onResetPassword: (admin: AdminResponseDTO) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminList({ admins, currentAdminId, onToggleActive, onResetPassword }: AdminListProps) {
  if (admins.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Nenhum administrador cadastrado.</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {admins.map((admin) => {
        const isSelf = admin.id === currentAdminId;
        return (
          <div key={admin.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.username}>{admin.username}</h3>
              <span className={admin.isActive ? styles.badgeActive : styles.badgeInactive}>
                {admin.isActive ? 'Ativo' : 'Inativo'}
              </span>
              {admin.mustChangePassword && (
                <span className={styles.badgeWarning}>Deve trocar senha</span>
              )}
              {isSelf && (
                <span className={styles.badgeSelf}>Você</span>
              )}
            </div>
            <p className={styles.date}>Criado em {formatDate(admin.createdAt)}</p>
            <div className={styles.cardActions}>
              <button
                className={admin.isActive ? styles.deactivateButton : styles.activateButton}
                onClick={() => onToggleActive(admin)}
                disabled={isSelf}
                title={isSelf ? 'Não é possível alterar seu próprio status' : undefined}
              >
                {admin.isActive ? 'Desativar' : 'Ativar'}
              </button>
              <button
                className={styles.resetButton}
                onClick={() => onResetPassword(admin)}
                disabled={isSelf}
                title={isSelf ? 'Use "Alterar Senha" para sua própria conta' : undefined}
              >
                Redefinir Senha
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
