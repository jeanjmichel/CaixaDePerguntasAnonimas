'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/interface/hooks/useApi';
import type { AdminResponseDTO } from '@/application/dtos/AdminResponseDTO';
import styles from './LoginForm.module.css';

interface LoginResponse {
  mustChangePassword: boolean;
  admin: AdminResponseDTO;
}

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setError(null);
    setSubmitting(true);

    const result = await apiFetch<LoginResponse>('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    setSubmitting(false);

    if (result.error) {
      if (result.error.code === 'INVALID_CREDENTIALS') {
        setError('Usuário ou senha incorretos.');
      } else {
        setError('Ocorreu um erro ao fazer login. Tente novamente.');
      }
      return;
    }

    if (result.data?.mustChangePassword) {
      router.replace('/admin/change-password');
    } else {
      router.replace('/admin/meetings');
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <label htmlFor="username" className={styles.label}>Usuário</label>
        <input
          id="username"
          type="text"
          className={styles.input}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          disabled={submitting}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="password" className={styles.label}>Senha</label>
        <input
          id="password"
          type="password"
          className={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
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
        disabled={!username || !password || submitting}
      >
        {submitting ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}
