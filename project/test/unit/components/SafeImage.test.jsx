import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SafeImage from '@/components/ui/SafeImage.jsx';

describe('SafeImage', () => {
    describe('when src is provided', () => {
        it('renders an img element', () => {
            const { container } = render(<SafeImage src="/mob.png" alt="zombie" />);
            const img = container.querySelector('img');
            expect(img).not.toBeNull();
            expect(img).toHaveAttribute('src', '/mob.png');
            expect(img).toHaveAttribute('alt', 'zombie');
        });

        it('passes className to the img element', () => {
            const { container } = render(<SafeImage src="/mob.png" alt="zombie" className="my-class" />);
            const img = container.querySelector('img');
            expect(img).toHaveClass('my-class');
        });

        it('calls onClick when clicked on img', () => {
            let clicked = false;
            const { container } = render(
                <SafeImage src="/mob.png" alt="zombie" onClick={() => { clicked = true; }} />
            );
            const img = container.querySelector('img');
            fireEvent.click(img);
            expect(clicked).toBe(true);
        });
    });

    describe('when src is empty/null', () => {
        it('renders the placeholder when src is null', () => {
            render(<SafeImage src={null} alt="zombie" />);
            expect(screen.getByText('📦')).toBeInTheDocument();
            expect(screen.getByText('zombie')).toBeInTheDocument();
        });

        it('renders the placeholder when src is empty string', () => {
            render(<SafeImage src="" alt="zombie" />);
            expect(screen.getByText('📦')).toBeInTheDocument();
        });

        it('renders the placeholder when src is undefined', () => {
            render(<SafeImage alt="zombie" />);
            expect(screen.getByText('📦')).toBeInTheDocument();
        });

        it('calls onClick when placeholder is clicked', () => {
            let clicked = false;
            render(
                <SafeImage src={null} alt="zombie" onClick={() => { clicked = true; }} />
            );
            fireEvent.click(screen.getByText('📦'));
            expect(clicked).toBe(true);
        });
    });

    describe('when image fails to load', () => {
        it('switches to placeholder on onError', () => {
            const { container } = render(<SafeImage src="/broken.png" alt="zombie" />);
            const img = container.querySelector('img');
            // Initially renders as img
            expect(img).not.toBeNull();
            // Simulate load error
            fireEvent.error(img);
            // Should now show placeholder
            expect(screen.getByText('📦')).toBeInTheDocument();
        });
    });

    describe('src change resets error', () => {
        it('shows img again after src changes to a valid src post-error', () => {
            const { container, rerender } = render(<SafeImage src="/broken.png" alt="zombie" />);
            const img = container.querySelector('img');
            // Trigger error to set error=true
            fireEvent.error(img);
            expect(screen.getByText('📦')).toBeInTheDocument();

            // Change src — useEffect resets error to false
            act(() => {
                rerender(<SafeImage src="/new-valid.png" alt="zombie" />);
            });

            const newImg = container.querySelector('img');
            // Bug note: useEffect calls setError(false) even though it anti-pattern
            // (eslint-disable comment in source). Behavior: error resets on src change.
            expect(newImg).not.toBeNull();
            expect(newImg).toHaveAttribute('src', '/new-valid.png');
        });
    });
});
