import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SuccessMessage } from '@/interface/components/public/SuccessMessage';

describe('SuccessMessage', () => {
  const defaultProps = {
    avatarId: 'CAPIVARA',
    onSendAnother: jest.fn(),
  };

  beforeEach(() => {
    defaultProps.onSendAnother = jest.fn();
  });

  it('should render success message', () => {
    render(<SuccessMessage {...defaultProps} />);

    expect(screen.getByText('Pergunta enviada com sucesso!')).toBeInTheDocument();
  });

  it('should display avatar name', () => {
    render(<SuccessMessage {...defaultProps} />);

    expect(screen.getByText(/Capivara/)).toBeInTheDocument();
  });

  it('should show anonymity note', () => {
    render(<SuccessMessage {...defaultProps} />);

    expect(screen.getByText(/anônima/i)).toBeInTheDocument();
  });

  it('should call onSendAnother when button is clicked', () => {
    render(<SuccessMessage {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /enviar outra/i }));
    expect(defaultProps.onSendAnother).toHaveBeenCalledTimes(1);
  });

  it('should handle unknown avatar gracefully', () => {
    render(<SuccessMessage avatarId="UNKNOWN" onSendAnother={() => {}} />);

    expect(screen.getByText('Pergunta enviada com sucesso!')).toBeInTheDocument();
  });
});
