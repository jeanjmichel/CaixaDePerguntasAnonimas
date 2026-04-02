'use client';

import { useState, useRef, type FormEvent } from 'react';
import type { AvatarResponseDTO } from '@/application/dtos/AvatarResponseDTO';
import type { SubmitQuestionOutput } from '@/application/dtos/SubmitQuestionOutput';
import { AvatarSelector } from '@/interface/components/public/AvatarSelector';
import { apiFetch } from '@/interface/hooks/useApi';
import styles from './QuestionForm.module.css';

const MIN_LENGTH = 5;
const MAX_LENGTH = 500;
const DEBOUNCE_MS = 1000;

interface QuestionFormProps {
  meetingId: string;
  avatars: AvatarResponseDTO[];
  onSuccess: (result: SubmitQuestionOutput) => void;
}

export function QuestionForm({ meetingId, avatars, onSuccess }: QuestionFormProps) {
  const [text, setText] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef(false);

  const trimmedLength = text.trim().length;
  const isValid = trimmedLength >= MIN_LENGTH && trimmedLength <= MAX_LENGTH;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValid || submitting || debounceRef.current) return;

    setError(null);
    setSubmitting(true);
    debounceRef.current = true;

    const body: Record<string, string> = {
      meetingId,
      text: text.trim(),
    };
    if (selectedAvatarId) {
      body.avatarId = selectedAvatarId;
    }

    const result = await apiFetch<SubmitQuestionOutput>('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setSubmitting(false);
    setTimeout(() => { debounceRef.current = false; }, DEBOUNCE_MS);

    if (result.error) {
      if (result.error.code === 'RATE_LIMITED' && result.retryAfterMs) {
        const seconds = Math.ceil(result.retryAfterMs / 1000);
        setError(`Você atingiu o limite de envios. Tente novamente em ${seconds} segundos.`);
      } else if (result.error.code === 'MEETING_CLOSED') {
        setError('Esta reunião não está mais aceitando perguntas.');
      } else if (result.error.code === 'INVALID_INPUT') {
        setError(result.error.message);
      } else {
        setError('Ocorreu um erro ao enviar sua pergunta. Tente novamente.');
      }
      return;
    }

    if (result.data) {
      onSuccess(result.data);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <AvatarSelector
        avatars={avatars}
        selectedId={selectedAvatarId}
        onSelect={setSelectedAvatarId}
        disabled={submitting}
      />

      <div className={styles.textareaWrapper}>
        <textarea
          className={styles.textarea}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Digite sua pergunta aqui..."
          maxLength={MAX_LENGTH}
          disabled={submitting}
          aria-label="Texto da pergunta"
        />
        <div className={styles.meta}>
          <span />
          <span className={`${styles.counter} ${trimmedLength > MAX_LENGTH ? styles.over : ''}`}>
            {trimmedLength} / {MAX_LENGTH}
          </span>
        </div>
      </div>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <button
        type="submit"
        className={styles.submitButton}
        disabled={!isValid || submitting || debounceRef.current}
      >
        {submitting ? 'Enviando...' : 'Enviar pergunta'}
      </button>
    </form>
  );
}
