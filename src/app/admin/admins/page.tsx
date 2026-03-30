'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/interface/hooks/useAuth';
import { apiFetch } from '@/interface/hooks/useApi';
import type { AdminResponseDTO } from '@/application/dtos/AdminResponseDTO';
import { AdminList } from '@/interface/components/admin/AdminList';
import { AdminForm } from '@/interface/components/admin/AdminForm';
import styles from './page.module.css';

type ViewState = 'list' | 'create';

export default function AdminsPage() {
  const { admin, loading, logout } = useAuth();
  const [admins, setAdmins] = useState<AdminResponseDTO[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [view, setView] = useState<ViewState>('list');

  const fetchAdmins = useCallback(async () => {
    setLoadingAdmins(true);
    const result = await apiFetch<AdminResponseDTO[]>('/api/admin/admins');
    if (result.data) {
      setAdmins(result.data);
    }
    setLoadingAdmins(false);
  }, []);

  useEffect(() => {
    if (!loading && admin) {
      fetchAdmins();
    }
  }, [loading, admin, fetchAdmins]);

  async function handleToggleActive(target: AdminResponseDTO) {
    const action = target.isActive ? 'desativar' : 'ativar';
    const confirmed = window.confirm(`Deseja ${action} o administrador "${target.username}"?`);
    if (!confirmed) return;

    await apiFetch(`/api/admin/admins/${target.id}/toggle-active`, { method: 'POST' });
    await fetchAdmins();
  }

  async function handleResetPassword(target: AdminResponseDTO) {
    const newPassword = window.prompt(`Digite a nova senha para "${target.username}" (mín. 8 caracteres):`);
    if (!newPassword) return;

    if (newPassword.length < 8) {
      window.alert('A senha deve ter no mínimo 8 caracteres.');
      return;
    }

    const result = await apiFetch(`/api/admin/admins/${target.id}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword }),
    });

    if (result.error) {
      window.alert(result.error.message || 'Erro ao redefinir senha.');
      return;
    }

    window.alert(`Senha de "${target.username}" redefinida. O usuário deverá trocar a senha no próximo login.`);
    await fetchAdmins();
  }

  function handleFormSuccess() {
    setView('list');
    fetchAdmins();
  }

  function handleCancel() {
    setView('list');
  }

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Administradores</h1>
        <div className={styles.actions}>
          {admin && <span className={styles.user}>{admin.username}</span>}
          <button className={styles.logoutButton} onClick={logout}>Sair</button>
        </div>
      </div>

      {view === 'list' && (
        <>
          <div className={styles.toolbar}>
            <button className={styles.createButton} onClick={() => setView('create')}>
              + Novo Administrador
            </button>
          </div>
          {loadingAdmins ? (
            <div className={styles.loading}>Carregando administradores...</div>
          ) : (
            <AdminList
              admins={admins}
              currentAdminId={admin?.id ?? ''}
              onToggleActive={handleToggleActive}
              onResetPassword={handleResetPassword}
            />
          )}
        </>
      )}

      {view === 'create' && (
        <AdminForm
          onSuccess={handleFormSuccess}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
