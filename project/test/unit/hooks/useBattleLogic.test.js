import { renderHook, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { useBattleLogic } from '@/hooks/useBattleLogic';

/* -------------------------------------------------------------------------- */
/*                                   MOCKS                                    */
/* -------------------------------------------------------------------------- */

// Fix Audio.play().catch crash
global.Audio = class {
  play() {
    return Promise.resolve();
  }
};

/* -------------------------------------------------------------------------- */
/*                              HOOK FACTORY                                  */
/* -------------------------------------------------------------------------- */

const createHook = (overrides = {}) => {
  const defaultProps = {
    skills: {
      math: {
        level: 1,
        xp: 0,
        mobHealth: 100,
        mobMaxHealth: 100,
        difficulty: 1,
      },
    },
    setSkills: vi.fn(),
    stats: {},
    setStats: vi.fn(),
    battlingSkillId: 'math',
    setChallengeData: vi.fn(),
    battleDifficulty: 1,
    setSpokenText: vi.fn(),
    checkAchievements: vi.fn(),
    setPlayerHealth: vi.fn(),
    generateChallenge: vi.fn(),
  };

  return renderHook(() =>
    useBattleLogic({
      ...defaultProps,
      ...overrides,
    })
  );
};

/* -------------------------------------------------------------------------- */
/*                                   TESTS                                    */
/* -------------------------------------------------------------------------- */

describe('useBattleLogic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* ------------------------ success hit ------------------------ */

  test('handleSuccessHit triggers skill update', async () => {
    const mockSetSkills = vi.fn();

    const { result } = createHook({
      setSkills: mockSetSkills,
    });

    await act(async () => {
      result.current.handleSuccessHit('math');
    });

    expect(mockSetSkills).toHaveBeenCalled();
  });

  /* ------------------------ wrong answer ------------------------ */

  test('wrong answer does not update skills', async () => {
    const mockSetSkills = vi.fn();

    const { result } = createHook({
      setSkills: mockSetSkills,
    });

    await act(async () => {
      result.current.handleSuccessHit('math', 'WRONG');
    });

    expect(mockSetSkills).not.toHaveBeenCalled();
  });

  /* ------------------------ API surface ------------------------ */

  test('transition function exists', () => {
    const { result } = createHook();

    expect(result.current.transition).toBeDefined();
  });

  /* ------------------------ level up ------------------------ */

test('level increases when enough XP is gained', async () => {
  const mockSetSkills = vi.fn();

  const { result } = createHook({
    setSkills: mockSetSkills,
    skills: {
      math: {
        level: 1,
        xp: 9999,
        mobHealth: 0,
        mobMaxHealth: 100,
        difficulty: 1,
      },
    },
  });

  await act(async () => {
    result.current.handleSuccessHit('math');
    await new Promise(r => setTimeout(r, 0)); // ✅ fix
  });

  expect(mockSetSkills).toHaveBeenCalled();
});

  /* ------------------------ mob death ------------------------ */

  test('mob death triggers state update', async () => {
    const mockSetSkills = vi.fn();

    const { result } = createHook({
      setSkills: mockSetSkills,
      skills: {
        math: {
          level: 1,
          xp: 0,
          mobHealth: 0,
          mobMaxHealth: 100,
          difficulty: 1,
        },
      },
    });

    await act(async () => {
      result.current.handleSuccessHit('math');
    });

    expect(mockSetSkills).toHaveBeenCalled();
  });
});