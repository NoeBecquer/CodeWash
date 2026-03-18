import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BugReportModal from '../src/components/modals/BugReportModal.jsx';

describe('BugReportModal', () => {
    it('returns null when isOpen=false', () => {
        const { container } = render(<BugReportModal isOpen={false} onClose={() => {}} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders the modal content when isOpen=true', () => {
        render(<BugReportModal isOpen={true} onClose={() => {}} />);
        expect(screen.getByText('Discovered a bug?')).toBeInTheDocument();
    });

    it('shows the "Whoa... That sucks..." message', () => {
        render(<BugReportModal isOpen={true} onClose={() => {}} />);
        expect(screen.getByText('Whoa... That sucks...')).toBeInTheDocument();
    });

    it('calls onClose when backdrop is clicked', () => {
        let closed = false;
        const { container } = render(<BugReportModal isOpen={true} onClose={() => { closed = true; }} />);
        // The backdrop is the absolute div (first child of the outer fixed div)
        const backdrop = container.querySelector('.absolute');
        fireEvent.click(backdrop);
        expect(closed).toBe(true);
    });

    it('does not call onClose when modal content is clicked', () => {
        let closed = false;
        const { container } = render(<BugReportModal isOpen={true} onClose={() => { closed = true; }} />);
        const modalContent = container.querySelector('.relative');
        fireEvent.click(modalContent);
        expect(closed).toBe(false);
    });
});
