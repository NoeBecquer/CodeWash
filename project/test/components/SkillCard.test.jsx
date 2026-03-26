import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';

import SkillCard from '@/components/skillcard/SkillCard';

// 🔧 Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// 🔧 Mock heavy dependencies
vi.mock('@/utils/soundManager', () => ({
  playClick: vi.fn(),
  getSfxVolume: () => 1,
}));

vi.mock('@/utils/gameUtils', () => ({
  calculateXPToLevel: () => 100,
  normalizeText: (t) => t,
}));

// 🔥 Mock game logic
vi.mock('@/components/skillcard/useSkillGame', () => ({
  useSkillGame: () => ({
    handleCardClick: vi.fn(),
    gameState: {},
  }),
}));

describe('SkillCard', () => {
  test('renders and responds to click', () => {
    const mockStartBattle = vi.fn();

    render(
      <SkillCard
        config={{ id: 'memory' }}
        data={{
          level: 1,
          xp: 0,
          mobHealth: 100,
          mobMaxHealth: 100,
        }}
        themeData={{
          skills: {
            memory: { name: 'Memory' },
          },
          assets: {
            mobs: {},
          },
        }}
        damageNumbers={[]} // ✅ FIX
        onStartBattle={mockStartBattle}
        onEndBattle={() => {}}
        isBattling={false}
        difficulty={1}
      />
    );

    const button = screen.getByTestId('start-battle-memory');

    fireEvent.click(button);

    expect(mockStartBattle).toHaveBeenCalledWith('memory');
  });
});