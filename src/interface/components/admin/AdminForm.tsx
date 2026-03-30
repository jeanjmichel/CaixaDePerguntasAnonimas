'use client';

import { useState, type FormEvent } from 'react';
import { apiFetch } from '@/interface/hooks/useApi';
import styles from './AdminForm.module.css';

interface AdminFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AdminForm({ onSuccess, onCancel }: AdminFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setError(null);
    setSubmitting(true);

    const result = await apiFetch<unknown>('/api/admin/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    setSubmitting(false);

    if (result.error) {
      if (result.error.code === 'INVALID_INPUT') {
        setError(result.error.message);
      } else if (result.error.code === 'USERNAME_ALREADY_EXISTS') {
        setError('Este nome de usuário já está em uso.');
      } else {
        setError('Ocorreu um erro. Tente novamente.');
      }
      return;
    }

    onSuccess();
  }

  const isValid = username.trim().length >= 3 && password.length >= 8;

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.formTitle}>Novo Administrador</h2>

      <div className={styles.field}>
        <label htmlFor="username" className={styles.label}>Usuário</label>
        <input
          id="username"
          type="text"
          className={styles.input}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={50}
          autoComplete="off"
          disabled={submitting}
        />
        <span className={styles.hint}>3-50 caracteres (letras, números, _, ., -)</span>
      </div>

      <div className={styles.field}>
        <label htmlFor="password" className={styles.label}>Senha</label>
        <input
          id="password"
          type="password"
          className={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          maxLength={128}
          autoComplete="new-password"
          disabled={submitting}
        />
        <span className={styles.hint}>Mínimo 8 caracteres</span>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.buttons}>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={onCancel}
          disabled={submitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={!isValid || submitting}
        >
          {submitting ? 'Criando...' : 'Criar Administrador'}
        </button>
      </div>
    </form>
  );
}
