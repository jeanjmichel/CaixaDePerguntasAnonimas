'use client';

import type { QuestionResponseDTO } from '@/application/dtos/QuestionResponseDTO';
import styles from './QuestionCard.module.css';

interface QuestionCardProps {
  question: QuestionResponseDTO;
  onSelect?: (id: string) => void;
  onDiscard?: (id: string) => void;
  onAnswer?: (id: string) => void;
  actionLoading: string | null;
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

export function QuestionCard({ question, onSelect, onDiscard, onAnswer, actionLoading }: QuestionCardProps) {
  const isLoading = actionLoading === question.id;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.avatar}>
          <span className={styles.avatarIcon}>{question.avatarIcon}</span>
          <span className={styles.avatarName}>{question.avatarDisplayName}</span>
        </span>
        <span className={styles.date}>{formatDate(question.createdAt)}</span>
      </div>
      <p className={styles.text}>{question.text}</p>
      <div className={styles.actions}>
        {onSelect && (
          <button
            className={styles.selectButton}
            onClick={() => onSelect(question.id)}
            disabled={isLoading}
          >
            Selecionar
          </button>
        )}
        {onAnswer && (
          <button
            className={styles.answerButton}
            onClick={() => onAnswer(question.id)}
            disabled={isLoading}
          >
            Respondida
          </button>
        )}
        {onDiscard && (
          <button
            className={styles.discardButton}
            onClick={() => onDiscard(question.id)}
            disabled={isLoading}
          >
            Descartar
          </button>
        )}
      </div>
    </div>
  );
}
