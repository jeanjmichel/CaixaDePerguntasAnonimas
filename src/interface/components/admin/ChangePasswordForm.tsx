'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/interface/hooks/useApi';
import styles from './ChangePasswordForm.module.css';

export function ChangePasswordForm() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setError(null);
    setSubmitting(true);

    const result = await apiFetch<{ message: string }>('/api/admin/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword, newPassword }),
    });

    setSubmitting(false);

    if (result.error) {
      if (result.error.code === 'INVALID_CURRENT_PASSWORD') {
        setError('Senha atual incorreta.');
      } else if (result.error.code === 'INVALID_INPUT') {
        setError(result.error.message);
      } else {
        setError('Ocorreu um erro. Tente novamente.');
      }
      return;
    }

    router.replace('/admin/meetings');
  }

  const isValid = oldPassword && newPassword && confirmPassword;

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <label htmlFor="oldPassword" className={styles.label}>Senha atual</label>
        <input
          id="oldPassword"
          type="password"
          className={styles.input}
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          autoComplete="current-password"
          disabled={submitting}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="newPassword" className={styles.label}>Nova senha</label>
        <input
          id="newPassword"
          type="password"
          className={styles.input}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          disabled={submitting}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="confirmPassword" className={styles.label}>Confirmar nova senha</label>
        <input
          id="confirmPassword"
          type="password"
          className={styles.input}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          disabled={submitting}
        />
      </div>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <button
        type="submit"
        className={styles.button}
        disabled={!isValid || submitting}
      >
        {submitting ? 'Salvando...' : 'Alterar senha'}
      </button>
    </form>
  );
}
