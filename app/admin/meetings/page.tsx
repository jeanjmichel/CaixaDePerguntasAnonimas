'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/interface/hooks/useAuth';
import { apiFetch } from '@/interface/hooks/useApi';
import type { MeetingResponseDTO } from '@/application/dtos/MeetingResponseDTO';
import { MeetingList } from '@/interface/components/admin/MeetingList';
import { MeetingForm } from '@/interface/components/admin/MeetingForm';
import styles from './page.module.css';

type ViewState = 'list' | 'create' | 'edit';

export default function MeetingsPage() {
  const { admin, loading, logout } = useAuth();
  const [meetings, setMeetings] = useState<MeetingResponseDTO[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [view, setView] = useState<ViewState>('list');
  const [editingMeeting, setEditingMeeting] = useState<MeetingResponseDTO | null>(null);

  const fetchMeetings = useCallback(async () => {
    setLoadingMeetings(true);
    const result = await apiFetch<MeetingResponseDTO[]>('/api/admin/meetings');
    if (result.data) {
      setMeetings(result.data);
    }
    setLoadingMeetings(false);
  }, []);

  useEffect(() => {
    if (!loading && admin) {
      fetchMeetings();
    }
  }, [loading, admin, fetchMeetings]);

  function handleCreate() {
    setEditingMeeting(null);
    setView('create');
  }

  function handleEdit(meeting: MeetingResponseDTO) {
    setEditingMeeting(meeting);
    setView('edit');
  }

  async function handleToggleOpen(meeting: MeetingResponseDTO) {
    const endpoint = meeting.isOpenForSubmissions
      ? `/api/admin/meetings/${meeting.id}/close`
      : `/api/admin/meetings/${meeting.id}/open`;

    await apiFetch<MeetingResponseDTO>(endpoint, { method: 'POST' });
    await fetchMeetings();
  }

  function handleFormSuccess() {
    setView('list');
    setEditingMeeting(null);
    fetchMeetings();
  }

  function handleCancel() {
    setView('list');
    setEditingMeeting(null);
  }

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Reuniões</h1>
        <div className={styles.actions}>
          {admin && <span className={styles.user}>{admin.username}</span>}
          <button className={styles.logoutButton} onClick={logout}>Sair</button>
        </div>
      </div>

      {view === 'list' && (
        <>
          <div className={styles.toolbar}>
            <button className={styles.createButton} onClick={handleCreate}>
              + Nova Reunião
            </button>
          </div>
          {loadingMeetings ? (
            <div className={styles.loading}>Carregando reuniões...</div>
          ) : (
            <MeetingList
              meetings={meetings}
              onEdit={handleEdit}
              onToggleOpen={handleToggleOpen}
            />
          )}
        </>
      )}

      {(view === 'create' || view === 'edit') && (
        <MeetingForm
          meeting={editingMeeting}
          onSuccess={handleFormSuccess}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
