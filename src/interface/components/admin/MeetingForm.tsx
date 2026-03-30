'use client';

import { useState, type FormEvent } from 'react';
import type { MeetingResponseDTO } from '@/application/dtos/MeetingResponseDTO';
import { apiFetch } from '@/interface/hooks/useApi';
import styles from './MeetingForm.module.css';

interface MeetingFormProps {
  meeting: MeetingResponseDTO | null;
  onSuccess: () => void;
  onCancel: () => void;
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function MeetingForm({ meeting, onSuccess, onCancel }: MeetingFormProps) {
  const isEditing = !!meeting;
  const [title, setTitle] = useState(meeting?.title ?? '');
  const [scheduledAt, setScheduledAt] = useState(
    meeting?.scheduledAt ? toDatetimeLocal(meeting.scheduledAt) : '',
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setError(null);
    setSubmitting(true);

    const isoDate = scheduledAt ? new Date(scheduledAt).toISOString() : '';

    const url = isEditing
      ? `/api/admin/meetings/${meeting.id}`
      : '/api/admin/meetings';

    const result = await apiFetch<MeetingResponseDTO>(url, {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, scheduledAt: isoDate }),
    });

    setSubmitting(false);

    if (result.error) {
      if (result.error.code === 'INVALID_INPUT') {
        setError(result.error.message);
      } else {
        setError('Ocorreu um erro. Tente novamente.');
      }
      return;
    }

    onSuccess();
  }

  const isValid = title.trim().length > 0 && scheduledAt.length > 0;

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.formTitle}>
        {isEditing ? 'Editar Reunião' : 'Nova Reunião'}
      </h2>

      <div className={styles.field}>
        <label htmlFor="title" className={styles.label}>Título</label>
        <input
          id="title"
          type="text"
          className={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          disabled={submitting}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="scheduledAt" className={styles.label}>Data e hora</label>
        <input
          id="scheduledAt"
          type="datetime-local"
          className={styles.input}
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          disabled={submitting}
        />
      </div>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <div className={styles.buttons}>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={onCancel}
          disabled={submitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={!isValid || submitting}
        >
          {submitting ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar'}
        </button>
      </div>
    </form>
  );
}
