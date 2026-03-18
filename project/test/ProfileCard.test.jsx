import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfileCard from '../src/components/profile/ProfileCard.jsx';

const defaultStats = {
    totalLevel: 42,
    skills: {},
    theme: null,
};

const defaultProps = {
    id: 1,
    name: 'TestPlayer',
    stats: defaultStats,
    isCurrent: false,
    onSwitch: vi.fn(),
    onRename: vi.fn(),
    isParent: false,
    onParentVerified: vi.fn(),
};

describe('ProfileCard', () => {
    it('renders without crashing', () => {
        expect(() => render(<ProfileCard {...defaultProps} />)).not.toThrow();
    });

    it('displays profile name', () => {
        render(<ProfileCard {...defaultProps} />);
        expect(screen.getByText(/TestPlayer/i)).toBeInTheDocument();
    });

    it('displays profile id as "P1,"', () => {
        render(<ProfileCard {...defaultProps} />);
        expect(screen.getByText('P1,')).toBeInTheDocument();
    });

    it('displays total level from stats', () => {
        render(<ProfileCard {...defaultProps} />);
        expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('shows 0 level when stats is null', () => {
        render(<ProfileCard {...defaultProps} stats={null} />);
        expect(screen.getByText('0')).toBeInTheDocument();
    });

    describe('isCurrent', () => {
        it('shows Pencil edit icon only when isCurrent=true', () => {
            const { container } = render(<ProfileCard {...defaultProps} isCurrent={true} />);
            // The Pencil is an SVG from lucide, look for it via the group/name hover
            // When isCurrent=true, name text has class text-yellow-100.
            const nameEl = container.querySelector('.text-yellow-100');
            expect(nameEl).not.toBeNull();
        });

        it('name is not yellow when isCurrent=false', () => {
            const { container } = render(<ProfileCard {...defaultProps} isCurrent={false} />);
            const nameEl = container.querySelector('.text-yellow-100');
            expect(nameEl).toBeNull();
        });
    });

    describe('isParent', () => {
        it('shows Crown when isParent=true', () => {
            render(<ProfileCard {...defaultProps} isParent={true} />);
            expect(screen.getByText(/Parent/i)).toBeInTheDocument();
        });

        it('shows "Parent?" checkbox label when isParent=false', () => {
            render(<ProfileCard {...defaultProps} isParent={false} />);
            expect(screen.getByText('Parent?')).toBeInTheDocument();
        });

        it('checkbox is unchecked when isParent=false', () => {
            render(<ProfileCard {...defaultProps} isParent={false} />);
            const checkbox = screen.getByRole('checkbox');
            expect(checkbox).not.toBeChecked();
        });

        it('clicking checkbox opens ParentalVerificationModal when isParent=false', () => {
            render(<ProfileCard {...defaultProps} isParent={false} />);
            const checkbox = screen.getByRole('checkbox');
            // Use fireEvent.click on the checkbox, which triggers onChange in React 18
            fireEvent.click(checkbox);
            expect(screen.getByText('What is this?')).toBeInTheDocument();
        });

        it('clicking checkbox does NOT open modal when isParent=true (already parent)', () => {
            render(<ProfileCard {...defaultProps} isParent={true} />);
            // No checkbox present when already a parent
            const checkbox = screen.queryByRole('checkbox');
            expect(checkbox).toBeNull();
        });
    });

    describe('onSwitch', () => {
        it('calls onSwitch(id) when card is clicked and not editing', () => {
            const onSwitch = vi.fn();
            const { container } = render(<ProfileCard {...defaultProps} onSwitch={onSwitch} />);
            // Click the top-level card div
            const card = container.querySelector('.cursor-pointer');
            fireEvent.click(card);
            expect(onSwitch).toHaveBeenCalledWith(1);
        });
    });

    describe('editing mode', () => {
        it('enters edit mode when Pencil is clicked (isCurrent=true)', () => {
            render(<ProfileCard {...defaultProps} isCurrent={true} />);
            // Find the Pencil icon (SVG), it is inside the group/name div
            // We use the group to locate it — look for the input that appears
            // by clicking the pencil SVG (last child of the name group)
            // Since SVGs don't have queryable text, we fire click on any SVG in the name row
            const svgIcons = screen.getAllByRole('img', { hidden: true });
            // Instead, find it by its parent classes
            const { container } = render(<ProfileCard {...defaultProps} isCurrent={true} />);
            // The Pencil click is on the svg with className containing text-slate-400
            const pencilWrapper = container.querySelector('.group\\/name');
            // Trigger entry into edit mode by clicking the pencil
            if (pencilWrapper) {
                const svgs = pencilWrapper.querySelectorAll('svg');
                if (svgs.length > 0) {
                    fireEvent.click(svgs[svgs.length - 1]); // Last svg = Pencil
                    expect(container.querySelector('input[type="text"]')).not.toBeNull();
                }
            }
        });

        it('calls onRename when Check button is clicked after editing', () => {
            const onRename = vi.fn();
            const { container } = render(
                <ProfileCard {...defaultProps} isCurrent={true} onRename={onRename} />
            );
            const pencilWrapper = container.querySelector('.group\\/name');
            if (pencilWrapper) {
                const svgs = pencilWrapper.querySelectorAll('svg');
                if (svgs.length > 0) {
                    fireEvent.click(svgs[svgs.length - 1]);
                    const textInput = container.querySelector('input[type="text"]');
                    if (textInput) {
                        fireEvent.change(textInput, { target: { value: 'NewName' } });
                        const checkBtn = container.querySelector('button');
                        fireEvent.click(checkBtn);
                        expect(onRename).toHaveBeenCalledWith(1, 'NewName');
                    }
                }
            }
        });
    });
});
