import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileCard from '@/components/profile/ProfileCard.jsx';

// -----------------------------
// MOCKS
// -----------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// 🔥 Portal-safe modal mock
vi.mock('@/components/ui/ParentalVerificationModal', () => ({
  default: ({ isOpen }) =>
    isOpen ? <div data-testid="parental-modal" /> : null,
}));

// -----------------------------
// HELPERS
// -----------------------------

const defaultStats = {
  totalLevel: 42,
  skills: {},
  theme: null,
};

const createProps = (overrides = {}) => ({
  id: 1,
  name: 'TestPlayer',
  stats: defaultStats,
  isCurrent: false,
  onSwitch: vi.fn(),
  onRename: vi.fn(),
  isParent: false,
  onParentVerified: vi.fn(),
  ...overrides,
});

// -----------------------------
// TESTS
// -----------------------------

describe('ProfileCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------
  // BASIC
  // -----------------------------
  it('renders without crashing', () => {
    expect(() => render(<ProfileCard {...createProps()} />)).not.toThrow();
  });

  it('displays profile name', () => {
    render(<ProfileCard {...createProps()} />);
    expect(screen.getByText(/TestPlayer/i)).toBeInTheDocument();
  });

  it('displays profile id', () => {
    render(<ProfileCard {...createProps()} />);
    expect(screen.getByText('P1,')).toBeInTheDocument();
  });

  it('displays total level', () => {
    render(<ProfileCard {...createProps()} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('falls back to 0 level when stats is null', () => {
    render(<ProfileCard {...createProps({ stats: null })} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  // -----------------------------
  // CURRENT PROFILE
  // -----------------------------
  describe('isCurrent', () => {
    it('applies highlight style', () => {
      const { container } = render(
        <ProfileCard {...createProps({ isCurrent: true })} />
      );
      expect(container.querySelector('.text-yellow-100')).not.toBeNull();
    });

    it('does not apply highlight when not current', () => {
      const { container } = render(
        <ProfileCard {...createProps({ isCurrent: false })} />
      );
      expect(container.querySelector('.text-yellow-100')).toBeNull();
    });
  });

  // -----------------------------
  // PARENT STATE
  // -----------------------------
  describe('isParent', () => {
    it('shows parent label when parent', () => {
      render(<ProfileCard {...createProps({ isParent: true })} />);
      expect(screen.getByText(/profile\.parent/i)).toBeInTheDocument();
    });

    it('shows checkbox when not parent', () => {
      render(<ProfileCard {...createProps({ isParent: false })} />);
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('checkbox is unchecked by default', () => {
      render(<ProfileCard {...createProps({ isParent: false })} />);
      expect(screen.getByRole('checkbox')).not.toBeChecked();
    });

    it('opens parental modal when checkbox clicked', async () => {
      const user = userEvent.setup();

      render(<ProfileCard {...createProps({ isParent: false })} />);

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      expect(screen.getByTestId('parental-modal')).toBeInTheDocument();
    });

    it('does not show checkbox when already parent', () => {
      render(<ProfileCard {...createProps({ isParent: true })} />);
      expect(screen.queryByRole('checkbox')).toBeNull();
    });
  });

  // -----------------------------
  // SWITCH PROFILE
  // -----------------------------
  describe('onSwitch', () => {
    it('calls onSwitch when card is clicked', async () => {
      const user = userEvent.setup();
      const onSwitch = vi.fn();

      const { container } = render(
        <ProfileCard {...createProps({ onSwitch })} />
      );

      const card = container.querySelector('.cursor-pointer');
      expect(card).toBeTruthy();

      await user.click(card);

      expect(onSwitch).toHaveBeenCalledWith(1);
    });
  });

  // -----------------------------
  // EDIT MODE
  // -----------------------------
  describe('editing mode', () => {
    it('enters edit mode when pencil is clicked', async () => {
      const user = userEvent.setup();

      const { container } = render(
        <ProfileCard {...createProps({ isCurrent: true })} />
      );

      const nameGroup = container.querySelector('.group\\/name');
      expect(nameGroup).toBeTruthy();

      const svgs = nameGroup.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);

      const pencil = svgs[svgs.length - 1];

      await user.click(pencil);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('calls onRename after editing', async () => {
      const user = userEvent.setup();
      const onRename = vi.fn();

      const { container } = render(
        <ProfileCard {...createProps({ isCurrent: true, onRename })} />
      );

      const nameGroup = container.querySelector('.group\\/name');
      const svgs = nameGroup.querySelectorAll('svg');
      const pencil = svgs[svgs.length - 1];

      await user.click(pencil);

      const input = screen.getByRole('textbox');

      await user.clear(input);
      await user.type(input, 'NewName');

      const confirmButton = container.querySelector('button');
      expect(confirmButton).toBeTruthy();

      await user.click(confirmButton);

      expect(onRename).toHaveBeenCalledWith(1, 'NewName');
    });
  });
});