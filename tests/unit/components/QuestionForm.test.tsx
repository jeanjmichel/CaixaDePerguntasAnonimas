import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuestionForm } from '@/interface/components/public/QuestionForm';
import type { AvatarResponseDTO } from '@/application/dtos/AvatarResponseDTO';

const mockAvatars: AvatarResponseDTO[] = [
  { id: 'CAPIVARA', displayName: 'Capivara', icon: '🦫' },
  { id: 'EMA', displayName: 'Ema', icon: '🦅' },
];

const defaultProps = {
  meetingId: 'meeting-1',
  avatars: mockAvatars,
  onSuccess: jest.fn(),
};

const originalFetch = globalThis.fetch;

beforeEach(() => {
  jest.restoreAllMocks();
  defaultProps.onSuccess = jest.fn();
  globalThis.fetch = jest.fn();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('QuestionForm', () => {
  it('should render textarea and submit button', () => {
    render(<QuestionForm {...defaultProps} />);

    expect(screen.getByLabelText('Texto da pergunta')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar pergunta/i })).toBeInTheDocument();
  });

  it('should show character counter', () => {
    render(<QuestionForm {...defaultProps} />);
    expect(screen.getByText('0 / 500')).toBeInTheDocument();
  });

  it('should update character counter as user types', () => {
    render(<QuestionForm {...defaultProps} />);
    const textarea = screen.getByLabelText('Texto da pergunta');

    fireEvent.change(textarea, { target: { value: 'Hello world' } });
    expect(screen.getByText('11 / 500')).toBeInTheDocument();
  });

  it('should disable submit button when text is too short', () => {
    render(<QuestionForm {...defaultProps} />);
    const button = screen.getByRole('button', { name: /enviar pergunta/i });

    expect(button).toBeDisabled();

    const textarea = screen.getByLabelText('Texto da pergunta');
    fireEvent.change(textarea, { target: { value: 'Hi' } });
    expect(button).toBeDisabled();
  });

  it('should enable submit button when text meets minimum length', () => {
    render(<QuestionForm {...defaultProps} />);
    const textarea = screen.getByLabelText('Texto da pergunta');
    const button = screen.getByRole('button', { name: /enviar pergunta/i });

    fireEvent.change(textarea, { target: { value: 'Valid question text' } });
    expect(button).toBeEnabled();
  });

  it('should call onSuccess after successful submission', async () => {
    const mockResult = {
      id: 'q1',
      meetingId: 'meeting-1',
      avatarId: 'CAPIVARA',
      text: 'Valid question text',
      status: 'Submitted',
      createdAt: '2026-03-30T00:00:00.000Z',
    };

    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockResult }),
      headers: new Headers(),
    } as Response);

    render(<QuestionForm {...defaultProps} />);
    const textarea = screen.getByLabelText('Texto da pergunta');
    fireEvent.change(textarea, { target: { value: 'Valid question text' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar pergunta/i }));

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalledWith(mockResult);
    });
  });

  it('should show rate limit error with retry time', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({ error: { code: 'RATE_LIMITED', message: 'Rate limited' } }),
      headers: new Headers({ 'Retry-After': '30' }),
    } as unknown as Response);

    render(<QuestionForm {...defaultProps} />);
    const textarea = screen.getByLabelText('Texto da pergunta');
    fireEvent.change(textarea, { target: { value: 'Valid question text' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar pergunta/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/30 segundos/);
    });
  });

  it('should show meeting closed error', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ error: { code: 'MEETING_CLOSED', message: 'Meeting closed' } }),
      headers: new Headers(),
    } as unknown as Response);

    render(<QuestionForm {...defaultProps} />);
    const textarea = screen.getByLabelText('Texto da pergunta');
    fireEvent.change(textarea, { target: { value: 'Valid question text' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar pergunta/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/não está mais aceitando/i);
    });
  });

  it('should show submitting state while sending', async () => {
    let resolvePromise: (value: Response) => void;
    const promise = new Promise<Response>((resolve) => { resolvePromise = resolve; });
    (globalThis.fetch as jest.Mock).mockReturnValueOnce(promise);

    render(<QuestionForm {...defaultProps} />);
    const textarea = screen.getByLabelText('Texto da pergunta');
    fireEvent.change(textarea, { target: { value: 'Valid question text' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar pergunta/i }));

    expect(screen.getByRole('button', { name: /enviando/i })).toBeDisabled();

    resolvePromise!({
      ok: true,
      json: async () => ({ data: { id: 'q1', meetingId: 'meeting-1', avatarId: 'CAPIVARA', text: 'Valid question text', status: 'Submitted', createdAt: '2026-03-30T00:00:00.000Z' } }),
      headers: new Headers(),
    } as Response);

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });
});
