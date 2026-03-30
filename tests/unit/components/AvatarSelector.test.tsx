import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AvatarSelector } from '@/interface/components/public/AvatarSelector';
import type { AvatarResponseDTO } from '@/application/dtos/AvatarResponseDTO';

const mockAvatars: AvatarResponseDTO[] = [
  { id: 'CAPIVARA', displayName: 'Capivara', icon: '🦫' },
  { id: 'EMA', displayName: 'Ema', icon: '🦅' },
  { id: 'ARARA_AZUL', displayName: 'Arara-azul', icon: '🦜' },
];

describe('AvatarSelector', () => {
  it('should render all avatar buttons', () => {
    render(
      <AvatarSelector avatars={mockAvatars} selectedId={null} onSelect={() => {}} />
    );

    expect(screen.getByRole('radio', { name: 'Capivara' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Ema' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Arara-azul' })).toBeInTheDocument();
  });

  it('should mark selected avatar as checked', () => {
    render(
      <AvatarSelector avatars={mockAvatars} selectedId="EMA" onSelect={() => {}} />
    );

    expect(screen.getByRole('radio', { name: 'Ema' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Capivara' })).toHaveAttribute('aria-checked', 'false');
  });

  it('should call onSelect when avatar is clicked', () => {
    const onSelect = jest.fn();
    render(
      <AvatarSelector avatars={mockAvatars} selectedId={null} onSelect={onSelect} />
    );

    fireEvent.click(screen.getByRole('radio', { name: 'Capivara' }));
    expect(onSelect).toHaveBeenCalledWith('CAPIVARA');
  });

  it('should disable all buttons when disabled prop is true', () => {
    render(
      <AvatarSelector avatars={mockAvatars} selectedId={null} onSelect={() => {}} disabled />
    );

    const buttons = screen.getAllByRole('radio');
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it('should show hint about random avatar', () => {
    render(
      <AvatarSelector avatars={mockAvatars} selectedId={null} onSelect={() => {}} />
    );

    expect(screen.getByText(/aleatório/i)).toBeInTheDocument();
  });
});
