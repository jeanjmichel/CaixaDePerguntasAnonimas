'use client';

import Link from 'next/link';
import type { MeetingResponseDTO } from '@/application/dtos/MeetingResponseDTO';
import styles from './MeetingList.module.css';

interface MeetingListProps {
  meetings: MeetingResponseDTO[];
  onEdit: (meeting: MeetingResponseDTO) => void;
  onToggleOpen: (meeting: MeetingResponseDTO) => void;
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

export function MeetingList({ meetings, onEdit, onToggleOpen }: MeetingListProps) {
  if (meetings.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Nenhuma reunião cadastrada.</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {meetings.map((meeting) => (
        <div key={meeting.id} className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.meetingTitle}>{meeting.title}</h3>
            {meeting.isOpenForSubmissions && (
              <span className={styles.badge}>Aberta</span>
            )}
          </div>
          <p className={styles.date}>{formatDate(meeting.scheduledAt)}</p>
          <div className={styles.cardActions}>
            <Link
              href={`/admin/meetings/${meeting.id}/questions`}
              className={styles.questionsLink}
            >
              Ver Perguntas
            </Link>
            <button
              className={styles.editButton}
              onClick={() => onEdit(meeting)}
            >
              Editar
            </button>
            <button
              className={meeting.isOpenForSubmissions ? styles.closeButton : styles.openButton}
              onClick={() => onToggleOpen(meeting)}
            >
              {meeting.isOpenForSubmissions ? 'Fechar Coleta' : 'Abrir Coleta'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
