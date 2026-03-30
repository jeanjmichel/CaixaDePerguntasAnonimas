import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdminList } from '@/interface/components/admin/AdminList';
import type { AdminResponseDTO } from '@/application/dtos/AdminResponseDTO';

const mockAdmins: AdminResponseDTO[] = [
  {
    id: 'admin-1',
    username: 'admin',
    mustChangePassword: false,
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'admin-2',
    username: 'moderator',
    mustChangePassword: true,
    isActive: false,
    createdAt: '2025-06-15T12:00:00.000Z',
  },
];

describe('AdminList', () => {
  it('should render all admin usernames', () => {
    render(
      <AdminList
        admins={mockAdmins}
        currentAdminId="admin-1"
        onToggleActive={() => {}}
        onResetPassword={() => {}}
      />,
    );

    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('moderator')).toBeInTheDocument();
  });

  it('should show correct status badges', () => {
    render(
      <AdminList
        admins={mockAdmins}
        currentAdminId="admin-1"
        onToggleActive={() => {}}
        onResetPassword={() => {}}
      />,
    );

    expect(screen.getByText('Ativo')).toBeInTheDocument();
    expect(screen.getByText('Inativo')).toBeInTheDocument();
  });

  it('should show mustChangePassword badge', () => {
    render(
      <AdminList
        admins={mockAdmins}
        currentAdminId="admin-1"
        onToggleActive={() => {}}
        onResetPassword={() => {}}
      />,
    );

    expect(screen.getByText('Deve trocar senha')).toBeInTheDocument();
  });

  it('should show "Você" badge for current admin', () => {
    render(
      <AdminList
        admins={mockAdmins}
        currentAdminId="admin-1"
        onToggleActive={() => {}}
        onResetPassword={() => {}}
      />,
    );

    expect(screen.getByText('Você')).toBeInTheDocument();
  });

  it('should disable action buttons for the current admin', () => {
    render(
      <AdminList
        admins={mockAdmins}
        currentAdminId="admin-1"
        onToggleActive={() => {}}
        onResetPassword={() => {}}
      />,
    );

    const buttons = screen.getAllByRole('button');
    // First admin (self): Desativar + Redefinir Senha — both disabled
    const selfButtons = buttons.filter((btn) => btn.hasAttribute('disabled'));
    expect(selfButtons).toHaveLength(2);
  });

  it('should call onToggleActive when toggle button is clicked', () => {
    const onToggleActive = jest.fn();
    render(
      <AdminList
        admins={mockAdmins}
        currentAdminId="admin-1"
        onToggleActive={onToggleActive}
        onResetPassword={() => {}}
      />,
    );

    // Second admin's "Ativar" button (since inactive)
    const activateButton = screen.getByText('Ativar');
    fireEvent.click(activateButton);

    expect(onToggleActive).toHaveBeenCalledWith(mockAdmins[1]);
  });

  it('should call onResetPassword when reset button is clicked', () => {
    const onResetPassword = jest.fn();
    render(
      <AdminList
        admins={mockAdmins}
        currentAdminId="admin-1"
        onToggleActive={() => {}}
        onResetPassword={onResetPassword}
      />,
    );

    // Get the non-disabled "Redefinir Senha" button (second admin)
    const resetButtons = screen.getAllByText('Redefinir Senha');
    const enabledResetButton = resetButtons.find((btn) => !btn.hasAttribute('disabled'));
    fireEvent.click(enabledResetButton!);

    expect(onResetPassword).toHaveBeenCalledWith(mockAdmins[1]);
  });

  it('should show empty message when no admins', () => {
    render(
      <AdminList
        admins={[]}
        currentAdminId="admin-1"
        onToggleActive={() => {}}
        onResetPassword={() => {}}
      />,
    );

    expect(screen.getByText('Nenhum administrador cadastrado.')).toBeInTheDocument();
  });
});
