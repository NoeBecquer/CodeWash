import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';

import SkillCard from '@/components/skillcard/SkillCard';

// ================= MOCKS =================

// i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// utils
vi.mock('@/utils/soundManager', () => ({
  playClick: vi.fn(),
  getSfxVolume: () => 1,
}));

vi.mock('@/utils/gameUtils', () => ({
  calculateXPToLevel: () => 100,
  normalizeText: (t) => t,
}));

// game logic
vi.mock('@/components/skillcard/useSkillGame', () => ({
  useSkillGame: () => ({
    handleCardClick: vi.fn(),
    gameState: {},
  }),
}));

// 🔥 prevent MemoryGame / other games from crashing
vi.mock('@/components/skillcard/GameSection', () => ({
  default: () => <div>GAME_SECTION</div>,
}));

// ================= HELPERS =================

const defaultProps = {
  config: { id: 'memory', name: 'Memory' },
  data: {
    level: 1,
    xp: 0,
    mobHealth: 100,
    mobMaxHealth: 100,
  },
  themeData: {
    skills: {
      memory: { name: 'Memory' },
    },
    assets: { mobs: {} },
  },
  damageNumbers: [],
  onStartBattle: vi.fn(),
  onEndBattle: vi.fn(),
  isBattling: false,
  difficulty: 1,
};

const renderSkillCard = (props = {}) => {
  return render(<SkillCard {...defaultProps} {...props} />);
};

// ================= TESTS =================

describe('SkillCard', () => {
  test('clicking start battle triggers callback', () => {
    const mockStartBattle = vi.fn();

    renderSkillCard({
      onStartBattle: mockStartBattle,
    });

    fireEvent.click(screen.getByTestId('start-battle-memory'));

    expect(mockStartBattle).toHaveBeenCalledWith('memory');
  });

  test('renders skill level and name', () => {
    renderSkillCard({
      data: {
        ...defaultProps.data,
        level: 5,
      },
    });

    // avoid ambiguity
    expect(screen.getAllByText(/memory/i).length).toBeGreaterThan(0);

    expect(screen.getByText(/5/)).toBeTruthy();
  });

  test('renders battle UI when battling', () => {
    renderSkillCard({
      isBattling: true,
      challenge: { question: 'test', answer: 'test' },
    });

    expect(screen.getByText(/battle.xp/i)).toBeTruthy();
  });
});