'use client';

import { useAuth } from '@/interface/hooks/useAuth';
import { ChangePasswordForm } from '@/interface/components/admin/ChangePasswordForm';
import styles from './page.module.css';

export default function ChangePasswordPage() {
  const { loading } = useAuth({ skipPasswordCheck: true });

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Alterar Senha</h1>
      <p className={styles.subtitle}>Você precisa alterar sua senha antes de continuar.</p>
      <ChangePasswordForm />
    </div>
  );
}
