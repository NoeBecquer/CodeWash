// test/unit/components/SettingsDrawer.test.jsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SettingsDrawer from '@/components/drawers/SettingsDrawer';

/* -------------------------------------------------------------------------- */
/*                                   MOCKS                                    */
/* -------------------------------------------------------------------------- */

// Mock ProfileCard
vi.mock('@/components/profile/ProfileCard', () => ({
  default: () => <div>ProfileCard</div>,
}));

// Mock i18n
const changeLanguageMock = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      language: 'en',
      changeLanguage: changeLanguageMock,
    },
  }),
}));

/* -------------------------------------------------------------------------- */
/*                              TEST FACTORY                                  */
/* -------------------------------------------------------------------------- */

const createProps = (overrides = {}) => ({
  isOpen: true,
  onReset: vi.fn(),
  bgmVol: 0.5,
  setBgmVol: vi.fn(),
  sfxVol: 0.5,
  setSfxVol: vi.fn(),
  currentProfile: 1,
  onSwitchProfile: vi.fn(),
  profileNames: { 1: 'Player1', 2: 'Player2', 3: 'Player3' },
  onRenameProfile: vi.fn(),
  getProfileStats: vi.fn(() => ({ level: 1 })),
  parentStatus: {},
  onParentVerified: vi.fn(),
  currentSkills: {},
  ...overrides,
});

/* -------------------------------------------------------------------------- */
/*                                   TESTS                                    */
/* -------------------------------------------------------------------------- */

describe('SettingsDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* ----------------------------- render ----------------------------- */

  it('renders correctly when open', () => {
    render(<SettingsDrawer {...createProps()} />);

    expect(screen.getByText('settings.title')).toBeInTheDocument();
  });

  /* -------------------------- profile cards -------------------------- */

  it('renders 3 profile cards', () => {
    render(<SettingsDrawer {...createProps()} />);

    expect(screen.getAllByText('ProfileCard')).toHaveLength(3);
  });

  /* --------------------------- BGM slider ---------------------------- */

  it('updates BGM volume', () => {
    const setBgmVol = vi.fn();

    render(
      <SettingsDrawer {...createProps({ setBgmVol })} />
    );

    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: '0.8' } });

    expect(setBgmVol).toHaveBeenCalledWith(0.8);
  });

  /* --------------------------- SFX slider ---------------------------- */

  it('updates SFX volume', () => {
    const setSfxVol = vi.fn();

    render(
      <SettingsDrawer {...createProps({ setSfxVol })} />
    );

    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[1], { target: { value: '0.3' } });

    expect(setSfxVol).toHaveBeenCalledWith(0.3);
  });

  /* ------------------------ language switching ----------------------- */

  it('changes language to French', () => {
    render(<SettingsDrawer {...createProps()} />);

    fireEvent.click(screen.getByText('🇫🇷 Français'));

    expect(changeLanguageMock).toHaveBeenCalledWith('fr');
  });

  it('changes language to English', () => {
    render(<SettingsDrawer {...createProps()} />);

    fireEvent.click(screen.getByText('🇬🇧 English'));

    expect(changeLanguageMock).toHaveBeenCalledWith('en');
  });

  /* ----------------------------- reset ------------------------------- */

  it('calls onReset when delete button is clicked', () => {
    const onReset = vi.fn();

    render(
      <SettingsDrawer {...createProps({ onReset })} />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: /delete_profile_progress/i,
      })
    );

    expect(onReset).toHaveBeenCalled();
  });

  /* ----------------------------- closed ------------------------------ */

  it('is hidden when closed', () => {
    const { container } = render(
      <SettingsDrawer {...createProps({ isOpen: false })} />
    );

    expect(container.firstChild.className).toContain('-translate-x-full');
  });
});

it('changes language for all available options', () => {
  render(<SettingsDrawer {...createProps()} />);

  const languages = [
    { label: '🇨🇳 中文', code: 'zh' },
    { label: '🇮🇳 हिंदी', code: 'hi' },
    { label: '🇸🇦 عربي', code: 'ar' },
    { label: '🇪🇸 Español', code: 'es' },
    { label: '🇧🇩 বাঙালি', code: 'bn' },
    { label: '🇵🇹 Português', code: 'pt' },
    { label: '🇷🇺 Русский', code: 'ru' },
    { label: '🇵🇰 اردو', code: 'ur' },
  ];

  languages.forEach(({ label, code }) => {
    fireEvent.click(screen.getByText(label));
    expect(changeLanguageMock).toHaveBeenCalledWith(code);
  });
});
