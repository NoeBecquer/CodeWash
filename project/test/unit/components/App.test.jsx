import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import App from '@/App.jsx';

/* -------------------------------------------------------------------------- */
/*                                   MOCKS                                    */
/* -------------------------------------------------------------------------- */

const mockBGMManager = {
    setVolume: vi.fn(),
    isPlaying: false,
    play: vi.fn(),
    pause: vi.fn(),
    fadeToTrack: vi.fn(),
    stop: vi.fn(),
};

vi.mock('@/components/skillcard/SkillCard', () => ({
  default: () => <div>SkillCard</div>,
}));

vi.stubGlobal('fetch', vi.fn(() =>
  Promise.resolve({
    json: () =>
      Promise.resolve({
        writingWordIndex: [],
        readingWords: { '3': ['cat'] },
        funnyLongWords: [],
      }),
  })
));

vi.mock('@/components/ui/TopBar', () => ({
  default: () => <div>TopBar</div>,
}));

// i18n
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key, options) => options?.defaultValue || key,
        i18n: { language: 'en', changeLanguage: vi.fn() },
    }),
}));

// App state
vi.mock('@/hooks/useAppState', () => ({
    useAppState: () => ({
        currentProfile: 1,
        profileNames: ['Player'],
        parentStatus: false,
        skills: {
            math: { level: 1, difficulty: 1, earnedBadges: [] },
            reading: { level: 1, difficulty: 1, earnedBadges: [] },
        },
        activeTheme: 'minecraft',
        stats: {},
        playerHealth: 10,

        isMenuOpen: false,
        isSettingsOpen: false,
        isCosmeticsOpen: false,
        isResetOpen: false,
        isBugReportOpen: false,
        isFullscreen: false,

        selectedBorder: null,
        borderColor: '#fff',
        bgmVol: 0.5,
        sfxVol: 0.5,

        setSkills: vi.fn(),
        setActiveTheme: vi.fn(),
        setStats: vi.fn(),
        setPlayerHealth: vi.fn(),

        setIsMenuOpen: vi.fn(),
        setIsSettingsOpen: vi.fn(),
        setIsCosmeticsOpen: vi.fn(),
        setIsResetOpen: vi.fn(),
        setIsBugReportOpen: vi.fn(),
        setIsFullscreen: vi.fn(),

        setSelectedBorder: vi.fn(),
        setBorderColor: vi.fn(),
        setBgmVol: vi.fn(),
        setSfxVol: vi.fn(),

        switchProfile: vi.fn(),
        renameProfile: vi.fn(),
        resetProfile: vi.fn(),
        setParentVerified: vi.fn(),
        setCurrentProfile: vi.fn(),
    }),
}));

// Battle logic
vi.mock('@/hooks/useBattleLogic', () => ({
    useBattleLogic: () => ({
        handleSuccessHit: vi.fn(),
        damageNumbers: [],
        lootBox: null,
        showDeathOverlay: false,
        showLevelRestored: false,
        bossHealing: false,
        handlePhantomLevelAward: vi.fn(),
        handlePhantomCaught: vi.fn(),
        transition: vi.fn(),
    }),
}));

// Voice
vi.mock('@/hooks/useVoiceRecognition', () => ({
    useVoiceRecognition: () => ({
        startVoiceListener: vi.fn(),
        stopVoiceRecognition: vi.fn(),
        toggleMicListener: vi.fn(),
    }),
}));

// Heavy UI
vi.mock('@/components/layout/GameCarousel', () => ({
    default: () => <div>GameCarousel</div>,
}));
vi.mock('@/components/layout/BattleLayer', () => ({
    default: () => <div>BattleLayer</div>,
}));

// Sound
vi.mock('@/utils/soundManager', () => ({
    getBGMManager: vi.fn(() => mockBGMManager),
    setSfxVolume: vi.fn(),
    getSfxVolume: vi.fn(() => 0.5),
    playClick: vi.fn(),
    playAchievement: vi.fn(),
}));

// Audio
const mockPlay = vi.fn().mockResolvedValue(undefined);
vi.stubGlobal('Audio', vi.fn(() => ({
    play: mockPlay,
    pause: vi.fn(),
})));

/* -------------------------------------------------------------------------- */
/*                                   SETUP                                    */
/* -------------------------------------------------------------------------- */

beforeEach(() => {
    localStorage.clear();
    mockBGMManager.setVolume.mockClear();
});

afterEach(() => {
    vi.clearAllMocks();
});

/* -------------------------------------------------------------------------- */
/*                                   TESTS                                    */
/* -------------------------------------------------------------------------- */

describe('App (smoke tests)', () => {

    const renderApp = async () => {
        await act(async () => {
            render(<App />);
        });
    };

    /* ----------------------------- basic render ---------------------------- */

    it('renders without crashing', async () => {
        await renderApp();
        expect(document.body).toBeTruthy();
    });

    it('renders core UI elements', async () => {
        await renderApp();

        // SVGs (health, icons, etc.)
        expect(document.querySelectorAll('svg').length).toBeGreaterThan(0);

        // Buttons exist
        expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });

    /* ---------------------------- BGM behavior ----------------------------- */

    it('initializes BGM manager', async () => {
        const { getBGMManager } = await import('@/utils/soundManager');

        await renderApp();

        expect(getBGMManager).toHaveBeenCalled();
    });

    it('sets BGM volume on mount', async () => {
        await renderApp();
    
        await waitFor(() => {
            expect(mockBGMManager.setVolume.mock.calls.length).toBeGreaterThan(0);
        });
    });

    /* ----------------------------- localStorage ---------------------------- */

    it('handles existing profile in localStorage', async () => {
        localStorage.setItem('currentProfile_v1', '2');

        await renderApp();

        expect(document.body).toBeTruthy();
    });

    it('handles empty localStorage', async () => {
        await renderApp();

        expect(document.body).toBeTruthy();
    });

    /* ----------------------------- UI presence ----------------------------- */

    it('renders main game container', async () => {
        await renderApp();

        expect(screen.getByText('GameCarousel')).toBeInTheDocument();
    });

    it('does not open overlays by default', async () => {
        await renderApp();

        const overlays = document.querySelectorAll('.fixed.inset-0.bg-black\\/50');
        expect(overlays.length).toBe(0);
    });

});