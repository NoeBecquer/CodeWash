import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

import SkillCard from '@/components/skillcard/SkillCard';

// ================= MOCKS =================

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

vi.mock('@/utils/soundManager', () => ({
  getSfxVolume: () => 1,
}));

vi.mock('@/utils/gameUtils', () => ({
  calculateXPToLevel: () => 100,
  normalizeText: (t) => t,
}));

vi.mock('@/utils/mobDisplayUtils', () => ({
  AURA_ADJECTIVES: {},
}));

vi.mock('@/components/skillcard/useSkillGame', () => ({
  useSkillGame: () => ({
    handleCardClick: vi.fn(),
    gameState: {},
  }),
}));

// ================= CHILD COMPONENTS =================

vi.mock('@/components/skillcard/TopSection', () => ({
  default: ({ level }) => <div>LEVEL:{level}</div>,
}));

vi.mock('@/components/skillcard/HPBar', () => ({
  default: () => <div>HP_BAR</div>,
}));

vi.mock('@/components/skillcard/XPBar', () => ({
  default: ({ label }) => <div>{label}</div>,
}));

vi.mock('@/components/skillcard/GameSection', () => ({
  default: () => <div>GAME_SECTION</div>,
}));

vi.mock('@/components/skillcard/BattlePortal', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/ParentalVerificationModal', () => ({
  default: () => <div>MODAL</div>,
}));

// ================= FACTORY =================

const createProps = () => ({
  config: {
    id: 'memory',
    name: 'Memory',
    colorStyle: {},
  },
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
  onMathSubmit: vi.fn(),
  onMicClick: vi.fn(),
  isBattling: false,
  difficulty: 1,
  unlockedDifficulty: 1,
});

// ================= TESTS =================

describe('SkillCard', () => {
  let props;

  beforeEach(() => {
    props = createProps();
    vi.clearAllMocks();
  });

  it('renders idle state with start button', () => {
    render(<SkillCard {...props} />);

    expect(screen.getByTestId('start-battle-memory')).toBeInTheDocument();
  });

  it('calls onStartBattle when clicked', () => {
    render(<SkillCard {...props} />);

    fireEvent.click(screen.getByTestId('start-battle-memory'));

    expect(props.onStartBattle).toHaveBeenCalledWith('memory');
  });

  it('renders level correctly', () => {
    props.data.level = 5;

    render(<SkillCard {...props} />);

    expect(screen.getByText('LEVEL:5')).toBeInTheDocument();
  });

  it('renders battle UI', () => {
    props.isBattling = true;
    props.isCenter = true;
    props.challenge = { question: 'Q', answer: 'A' };

    render(<SkillCard {...props} />);

    expect(screen.getByText('GAME_SECTION')).toBeInTheDocument();
    expect(screen.getByText('battle.xp')).toBeInTheDocument();
  });

  it('hides start button when battling', () => {
    props.isBattling = true;
    props.isCenter = true;
    props.challenge = { question: 'Q', answer: 'A' };

    render(<SkillCard {...props} />);

    expect(screen.queryByTestId('start-battle-memory')).toBeNull();
  });
});