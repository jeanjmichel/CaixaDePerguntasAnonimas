'use client';

import type { QuestionResponseDTO } from '@/application/dtos/QuestionResponseDTO';
import { QuestionCard } from './QuestionCard';
import styles from './QuestionList.module.css';

interface QuestionListProps {
  questions: QuestionResponseDTO[];
  status: string;
  onSelect?: (id: string) => void;
  onDiscard?: (id: string) => void;
  onAnswer?: (id: string) => void;
  actionLoading: string | null;
}

const STATUS_EMPTY_MESSAGES: Record<string, string> = {
  Submitted: 'Nenhuma pergunta submetida.',
  Selected: 'Nenhuma pergunta selecionada.',
  Answered: 'Nenhuma pergunta respondida.',
  Discarded: 'Nenhuma pergunta descartada.',
};

export function QuestionList({ questions, status, onSelect, onDiscard, onAnswer, actionLoading }: QuestionListProps) {
  if (questions.length === 0) {
    return (
      <div className={styles.empty}>
        <p>{STATUS_EMPTY_MESSAGES[status] ?? 'Nenhuma pergunta encontrada.'}</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {questions.map((q) => (
        <QuestionCard
          key={q.id}
          question={q}
          onSelect={onSelect}
          onDiscard={onDiscard}
          onAnswer={onAnswer}
          actionLoading={actionLoading}
        />
      ))}
    </div>
  );
}
