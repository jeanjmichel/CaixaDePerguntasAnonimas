'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/interface/hooks/useAuth';
import { apiFetch } from '@/interface/hooks/useApi';
import type { QuestionResponseDTO } from '@/application/dtos/QuestionResponseDTO';
import type { MeetingResponseDTO } from '@/application/dtos/MeetingResponseDTO';
import { QuestionList } from '@/interface/components/admin/QuestionList';
import styles from './page.module.css';

const STATUSES = ['Submitted', 'Selected', 'Answered', 'Discarded'] as const;
const STATUS_LABELS: Record<string, string> = {
  Submitted: 'Submetidas',
  Selected: 'Selecionadas',
  Answered: 'Respondidas',
  Discarded: 'Descartadas',
};

export default function QuestionsPage() {
  const { admin, loading } = useAuth();
  const params = useParams<{ id: string }>();
  const meetingId = params.id;

  const [meeting, setMeeting] = useState<MeetingResponseDTO | null>(null);
  const [questions, setQuestions] = useState<QuestionResponseDTO[]>([]);
  const [activeStatus, setActiveStatus] = useState<string>('Submitted');
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchQuestions = useCallback(async (status: string) => {
    setLoadingQuestions(true);
    const result = await apiFetch<QuestionResponseDTO[]>(
      `/api/admin/meetings/${meetingId}/questions?status=${status}`,
    );
    if (result.data) {
      setQuestions(result.data);
    }
    setLoadingQuestions(false);
  }, [meetingId]);

  useEffect(() => {
    if (!loading && admin && meetingId) {
      apiFetch<MeetingResponseDTO>(`/api/admin/meetings/${meetingId}`).then((res) => {
        if (res.data) setMeeting(res.data);
      });
      fetchQuestions(activeStatus);
    }
  }, [loading, admin, meetingId, activeStatus, fetchQuestions]);

  async function handleAction(endpoint: string, questionId: string) {
    setActionLoading(questionId);
    await apiFetch<QuestionResponseDTO>(endpoint, { method: 'POST' });
    setActionLoading(null);
    await fetchQuestions(activeStatus);
  }

  function handleSelect(questionId: string) {
    handleAction(`/api/admin/questions/${questionId}/select`, questionId);
  }

  function handleDiscard(questionId: string) {
    handleAction(`/api/admin/questions/${questionId}/discard`, questionId);
  }

  function handleAnswer(questionId: string) {
    handleAction(`/api/admin/questions/${questionId}/answer`, questionId);
  }

  function handleStatusChange(status: string) {
    setActiveStatus(status);
  }

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  const actionProps: Record<string, {
    onSelect?: (id: string) => void;
    onDiscard?: (id: string) => void;
    onAnswer?: (id: string) => void;
  }> = {
    Submitted: { onSelect: handleSelect, onDiscard: handleDiscard },
    Selected: { onAnswer: handleAnswer, onDiscard: handleDiscard },
    Answered: {},
    Discarded: {},
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Link href="/admin/meetings" className={styles.backLink}>← Reuniões</Link>
          {meeting && <h1 className={styles.title}>{meeting.title}</h1>}
        </div>
      </div>

      <div className={styles.tabs}>
        {STATUSES.map((status) => (
          <button
            key={status}
            className={`${styles.tab} ${activeStatus === status ? styles.tabActive : ''}`}
            onClick={() => handleStatusChange(status)}
          >
            {STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {loadingQuestions ? (
        <div className={styles.loading}>Carregando perguntas...</div>
      ) : (
        <QuestionList
          questions={questions}
          status={activeStatus}
          actionLoading={actionLoading}
          {...actionProps[activeStatus]}
        />
      )}
    </div>
  );
}
