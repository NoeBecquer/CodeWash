import { renderHook, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { useBattleLogic } from '@/hooks/useBattleLogic';

// 🔧 Proper Audio mock (fixes .catch crash)
global.Audio = class {
  play() {
    return {
      catch: () => {},
    };
  }
};

const flush = async () => {
  await act(async () => {
    await new Promise(r => setTimeout(r, 0));
  });
};

// 🧱 Default factory to avoid duplication
const createHook = (overrides = {}) => {
  return renderHook(() =>
    useBattleLogic({
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
      ...overrides,
    })
  );
};

describe('useBattleLogic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

test('handleSuccessHit triggers skill update', async () => {
  const mockSetSkills = vi.fn();

  const { result } = createHook({
    setSkills: mockSetSkills,
  });

  await act(async () => {
    result.current.handleSuccessHit('math');
  });

  await flush();

  expect(mockSetSkills).toHaveBeenCalled();
});

test('wrong answer does not update skills', async () => {
  const mockSetSkills = vi.fn();

  const { result } = createHook({
    setSkills: mockSetSkills,
  });

  await act(async () => {
    result.current.handleSuccessHit('math', 'WRONG');
  });

  await flush();

  expect(mockSetSkills).not.toHaveBeenCalled();
});

  test('transition function exists', () => {
    const { result } = createHook();

    expect(result.current.transition).toBeDefined();
  });

  test('level increases when enough XP is gained', async () => {
    const mockSetSkills = vi.fn();

    const { result } = createHook({
      setSkills: mockSetSkills,
      skills: {
        math: {
          level: 1,
          xp: 9999, // force level-up
          mobHealth: 0,
          mobMaxHealth: 100,
          difficulty: 1,
        },
      },
    });

    await act(async () => {
      result.current.handleSuccessHit('math');
    });

    await flush();

    expect(mockSetSkills).toHaveBeenCalled();

    const updater = mockSetSkills.mock.calls[0][0];
    const updated = updater({
      math: {
        level: 1,
        xp: 9999,
        mobHealth: 0,
        mobMaxHealth: 100,
        difficulty: 1,
      },
    });

    expect(updated.math.level).toBeGreaterThan(1);
  });

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

  await flush();

  expect(mockSetSkills).toHaveBeenCalled();
});
});