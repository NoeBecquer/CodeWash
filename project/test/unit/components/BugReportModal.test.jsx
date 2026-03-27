import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BugReportModal from '@/components/modals/BugReportModal.jsx';

// -------------------------------------
// Helper
// -------------------------------------
const renderModal = (props = {}) => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
    };

    const utils = render(<BugReportModal {...defaultProps} {...props} />);
    return {
        ...utils,
        onClose: defaultProps.onClose,
    };
};

// -------------------------------------
// Tests
// -------------------------------------
describe('BugReportModal', () => {

    it('returns null when isOpen=false', () => {
        const { container } = render(<BugReportModal isOpen={false} onClose={() => {}} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders modal title and message when open', () => {
        renderModal();

        expect(screen.getByText('Discovered a bug?')).toBeInTheDocument();
        expect(screen.getByText('Whoa... That sucks...')).toBeInTheDocument();
    });

    it('calls onClose when backdrop is clicked', () => {
        const { container, onClose } = renderModal();

        const backdrop = container.querySelector('.absolute');
        fireEvent.click(backdrop);

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when modal content is clicked', () => {
        const { container, onClose } = renderModal();

        const modalContent = container.querySelector('.relative');
        fireEvent.click(modalContent);

        expect(onClose).not.toHaveBeenCalled();
    });
});