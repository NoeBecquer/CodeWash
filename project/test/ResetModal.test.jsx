import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ResetModal from '../src/components/modals/ResetModal.jsx';

describe('ResetModal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        onConfirm: vi.fn(),
    };

    describe('when isOpen=false', () => {
        it('renders nothing', () => {
            const { container } = render(<ResetModal isOpen={false} onClose={vi.fn()} onConfirm={vi.fn()} />);
            expect(container.firstChild).toBeNull();
        });
    });

    describe('when isOpen=true', () => {
        it('renders the heading Delete Progress?', () => {
            render(<ResetModal {...defaultProps} />);
            expect(screen.getByText('Delete Progress?')).toBeInTheDocument();
        });

        it('shows instructions to type DELETE', () => {
            render(<ResetModal {...defaultProps} />);
            expect(screen.getByText('DELETE')).toBeInTheDocument();
        });

        it('shows irreversible warning', () => {
            render(<ResetModal {...defaultProps} />);
            expect(screen.getByText(/This action is irreversible!/i)).toBeInTheDocument();
        });
    });

    describe('correct confirmation (DELETE)', () => {
        it('calls onConfirm when DELETE is typed and submitted', () => {
            const onConfirm = vi.fn();
            const { container } = render(<ResetModal isOpen={true} onClose={vi.fn()} onConfirm={onConfirm} />);
            const input = container.querySelector('input[type="text"]');
            fireEvent.change(input, { target: { value: 'DELETE' } });
            // After typing DELETE, button is enabled — click it
            fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
            expect(onConfirm).toHaveBeenCalledOnce();
        });

        it('calls onConfirm with lowercase "delete" typed (uppercased by handler)', () => {
            const onConfirm = vi.fn();
            const { container } = render(<ResetModal isOpen={true} onClose={vi.fn()} onConfirm={onConfirm} />);
            const input = container.querySelector('input[type="text"]');
            fireEvent.change(input, { target: { value: 'delete' } });
            // Input handler uppercases: 'delete' → 'DELETE', so button should be enabled
            fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
            expect(onConfirm).toHaveBeenCalledOnce();
        });
    });

    describe('wrong confirmation', () => {
        it('shows error on wrong text when form is submitted', () => {
            const { container } = render(<ResetModal {...defaultProps} />);
            const input = container.querySelector('input[type="text"]');
            fireEvent.change(input, { target: { value: 'WRONG' } });
            // Button is disabled for wrong text, use form submit directly
            const form = container.querySelector('form');
            fireEvent.submit(form);
            expect(screen.getByText(/Please type DELETE to confirm/i)).toBeInTheDocument();
        });

        it('does not call onConfirm on wrong text', () => {
            const onConfirm = vi.fn();
            const { container } = render(<ResetModal isOpen={true} onClose={vi.fn()} onConfirm={onConfirm} />);
            const input = container.querySelector('input[type="text"]');
            fireEvent.change(input, { target: { value: 'NOPE' } });
            const form = container.querySelector('form');
            fireEvent.submit(form);
            expect(onConfirm).not.toHaveBeenCalled();
        });

        it('empty submit shows error (via form submit)', () => {
            const { container } = render(<ResetModal {...defaultProps} />);
            const form = container.querySelector('form');
            fireEvent.submit(form);
            expect(screen.getByText(/Please type DELETE to confirm/i)).toBeInTheDocument();
        });

        it('error clears when user starts retyping', () => {
            const { container } = render(<ResetModal {...defaultProps} />);
            const input = container.querySelector('input[type="text"]');
            const form = container.querySelector('form');
            // Type wrong text and submit to trigger error
            fireEvent.change(input, { target: { value: 'WRONG' } });
            fireEvent.submit(form);
            expect(screen.getByText(/Please type DELETE to confirm/i)).toBeInTheDocument();
            // Now retype — handleInputChange calls setError(false)
            fireEvent.change(input, { target: { value: 'D' } });
            expect(screen.queryByText(/Please type DELETE to confirm/i)).toBeNull();
        });
    });

    describe('close actions', () => {
        it('calls onClose when X button is clicked', () => {
            const onClose = vi.fn();
            render(<ResetModal isOpen={true} onClose={onClose} onConfirm={vi.fn()} />);
            const closeBtn = screen.getAllByRole('button').find(b => !b.textContent.includes('Confirm'));
            fireEvent.click(closeBtn);
            expect(onClose).toHaveBeenCalledOnce();
        });

        it('calls onClose when backdrop is clicked', () => {
            const onClose = vi.fn();
            const { container } = render(<ResetModal isOpen={true} onClose={onClose} onConfirm={vi.fn()} />);
            const backdrop = container.querySelector('.absolute.inset-0');
            fireEvent.click(backdrop);
            expect(onClose).toHaveBeenCalledOnce();
        });
    });
});
