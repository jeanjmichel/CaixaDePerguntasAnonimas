'use client';

import { useState, useEffect } from 'react';
import type { MeetingResponseDTO } from '@/application/dtos/MeetingResponseDTO';
import type { AvatarResponseDTO } from '@/application/dtos/AvatarResponseDTO';
import type { SubmitQuestionOutput } from '@/application/dtos/SubmitQuestionOutput';
import { QuestionForm } from '@/interface/components/public/QuestionForm';
import { SuccessMessage } from '@/interface/components/public/SuccessMessage';
import { apiFetch } from '@/interface/hooks/useApi';
import styles from './page.module.css';

type PageState = 'loading' | 'no-meeting' | 'form' | 'success';

export default function Home() {
  const [state, setState] = useState<PageState>('loading');
  const [meeting, setMeeting] = useState<MeetingResponseDTO | null>(null);
  const [avatars, setAvatars] = useState<AvatarResponseDTO[]>([]);
  const [lastResult, setLastResult] = useState<SubmitQuestionOutput | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [meetingRes, avatarsRes] = await Promise.all([
        apiFetch<MeetingResponseDTO | null>('/api/meetings/open'),
        apiFetch<AvatarResponseDTO[]>('/api/avatars'),
      ]);

      if (avatarsRes.data) {
        setAvatars(avatarsRes.data);
      }

      if (meetingRes.error || avatarsRes.error) {
        setLoadError('Não foi possível carregar os dados. Tente recarregar a página.');
        setState('no-meeting');
        return;
      }

      if (!meetingRes.data) {
        setState('no-meeting');
        return;
      }

      setMeeting(meetingRes.data);
      setState('form');
    }

    load();
  }, []);

  function handleSuccess(result: SubmitQuestionOutput) {
    setLastResult(result);
    setState('success');
  }

  function handleSendAnother() {
    setLastResult(null);
    setState('form');
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>Caixa de Perguntas</h1>
          <p className={styles.subtitle}>Envie perguntas anônimas para a reunião</p>
        </header>

        {state === 'loading' && (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <span>Carregando...</span>
          </div>
        )}

        {state === 'no-meeting' && (
          <div className={styles.empty}>
            {loadError ? (
              <p>{loadError}</p>
            ) : (
              <>
                <span className={styles.emptyIcon}>📭</span>
                <p>Nenhuma reunião aberta para perguntas no momento.</p>
                <p className={styles.emptyHint}>Volte quando uma reunião estiver em andamento.</p>
              </>
            )}
          </div>
        )}

        {state === 'form' && meeting && (
          <div className={styles.formSection}>
            <div className={styles.meetingInfo}>
              <span className={styles.meetingLabel}>Reunião</span>
              <h2 className={styles.meetingTitle}>{meeting.title}</h2>
            </div>
            <div className={styles.anonNote}>
              🔒 Suas perguntas são anônimas
            </div>
            <QuestionForm
              meetingId={meeting.id}
              avatars={avatars}
              onSuccess={handleSuccess}
            />
          </div>
        )}

        {state === 'success' && lastResult && (
          <SuccessMessage
            avatarId={lastResult.avatarId}
            onSendAnother={handleSendAnother}
          />
        )}
      </main>
    </div>
  );
}
