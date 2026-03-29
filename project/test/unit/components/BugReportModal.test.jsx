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
    stats: {},
    skills: {},
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
    const { container } = render(
      <BugReportModal isOpen={false} onClose={() => {}} stats={{}} skills={{}} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders modal title and hint when open', () => {
    renderModal();

    expect(screen.getByText('Report a Bug')).toBeInTheDocument();
    expect(
      screen.getByText(/send a report via email/i)
    ).toBeInTheDocument();
  });

  it('updates textarea value when typing', () => {
    renderModal();

    const textarea = screen.getByPlaceholderText(
      /what happened/i
    );

    fireEvent.change(textarea, {
      target: { value: 'Test bug' },
    });

    expect(textarea.value).toBe('Test bug');
  });

  it('disables email button when description is empty', () => {
    renderModal();

    const emailButton = screen.getByText(/send via email/i);

    expect(emailButton).toBeDisabled();
  });

  it('enables email button when description is filled', () => {
    renderModal();

    const textarea = screen.getByPlaceholderText(/what happened/i);
    const emailButton = screen.getByText(/send via email/i);

    fireEvent.change(textarea, {
      target: { value: 'Bug here' },
    });

    expect(emailButton).not.toBeDisabled();
  });

  it('calls onClose when close button is clicked', () => {
    const { onClose } = renderModal();

    const closeButton = screen.getByText(/close/i);

    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});