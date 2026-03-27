import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ResetModal from '@/components/modals/ResetModal.jsx';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, params) => {
      const translations = {
        'modals.delete_progress_title': 'Delete Progress?',
        'modals.delete_progress_confirm': 'Are you sure?',
        'modals.delete_progress_irreversible': 'This action is irreversible',
        'modals.type_delete_confirm': `Type ${params?.word} to confirm`,
        'modals.please_type_delete': 'Please type DELETE',
        'modals.cancel': 'Cancel',
        'modals.delete': 'Delete',
      };

      return translations[key] || key;
    }
  })
}));

describe('ResetModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  };

  // ─────────────────────────────
  // CLOSED STATE
  // ─────────────────────────────
  it('renders nothing when closed', () => {
    const { container } = render(
      <ResetModal isOpen={false} onClose={vi.fn()} onConfirm={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  // ─────────────────────────────
  // RENDERING
  // ─────────────────────────────
  describe('rendering', () => {
    it('renders title', () => {
      render(<ResetModal {...defaultProps} />);
      expect(screen.getByText('Delete Progress?')).toBeInTheDocument();
    });

    it('shows instruction text', () => {
      render(<ResetModal {...defaultProps} />);
      expect(screen.getByText(/Type DELETE to confirm/i)).toBeInTheDocument();
    });

    it('shows irreversible warning', () => {
      render(<ResetModal {...defaultProps} />);
      expect(screen.getByText(/irreversible/i)).toBeInTheDocument();
    });
  });

  // ─────────────────────────────
  // SUCCESS CASE
  // ─────────────────────────────
  describe('valid confirmation', () => {
    it('calls onConfirm when DELETE is typed', () => {
      const onConfirm = vi.fn();
      render(<ResetModal {...defaultProps} onConfirm={onConfirm} />);

      const input = screen.getByTestId('delete-input');

      fireEvent.change(input, { target: { value: 'DELETE' } });
      fireEvent.click(screen.getByRole('button', { name: /delete/i }));

      expect(onConfirm).toHaveBeenCalledOnce();
    });

    it('accepts lowercase input', () => {
      const onConfirm = vi.fn();
      render(<ResetModal {...defaultProps} onConfirm={onConfirm} />);

      const input = screen.getByTestId('delete-input');

      fireEvent.change(input, { target: { value: 'delete' } });
      fireEvent.click(screen.getByRole('button', { name: /delete/i }));

      expect(onConfirm).toHaveBeenCalledOnce();
    });
  });

  // ─────────────────────────────
  // ERROR CASES
  // ─────────────────────────────
  describe('invalid confirmation', () => {
    it('shows error on wrong input', () => {
      const { container } = render(<ResetModal {...defaultProps} />);
      const input = screen.getByTestId('delete-input');

      fireEvent.change(input, { target: { value: 'WRONG' } });
      fireEvent.submit(container.querySelector('form'));

      expect(screen.getByText(/Please type DELETE/i)).toBeInTheDocument();
    });

    it('does not call onConfirm on wrong input', () => {
      const onConfirm = vi.fn();
      const { container } = render(
        <ResetModal {...defaultProps} onConfirm={onConfirm} />
      );

      const input = screen.getByTestId('delete-input');

      fireEvent.change(input, { target: { value: 'NOPE' } });
      fireEvent.submit(container.querySelector('form'));

      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('empty submit shows error', () => {
      const { container } = render(<ResetModal {...defaultProps} />);
      fireEvent.submit(container.querySelector('form'));

      expect(screen.getByText(/Please type DELETE/i)).toBeInTheDocument();
    });

    it('error clears when typing again', () => {
      const { container } = render(<ResetModal {...defaultProps} />);
      const input = screen.getByTestId('delete-input');

      fireEvent.change(input, { target: { value: 'WRONG' } });
      fireEvent.submit(container.querySelector('form'));

      expect(screen.getByText(/Please type DELETE/i)).toBeInTheDocument();

      fireEvent.change(input, { target: { value: 'D' } });

      expect(screen.queryByText(/Please type DELETE/i)).toBeNull();
    });
  });

  // ─────────────────────────────
  // CLOSE BEHAVIOR
  // ─────────────────────────────
  describe('closing', () => {
    it('calls onClose when clicking X', () => {
      const onClose = vi.fn();
      render(<ResetModal {...defaultProps} onClose={onClose} />);

      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[0]); // first button = X

      expect(onClose).toHaveBeenCalledOnce();
    });

    it('calls onClose when clicking backdrop', () => {
      const onClose = vi.fn();
      const { container } = render(
        <ResetModal {...defaultProps} onClose={onClose} />
      );

      fireEvent.click(container.querySelector('.absolute.inset-0'));

      expect(onClose).toHaveBeenCalledOnce();
    });
  });
});