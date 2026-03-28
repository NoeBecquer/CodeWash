import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { useBattleLogic } from '@/hooks/useBattleLogic';

/* -------------------------------------------------------------------------- */
/*                                   MOCKS                                    */
/* -------------------------------------------------------------------------- */

global.Audio = class {
  play() {
    return Promise.resolve();
  }
};

vi.mock('@/utils/gameUtils', () => ({
  calculateDamage: () => 20,
  calculateMobHealth: () => 100,
  calculateXPReward: () => 50,
  calculateXPToLevel: () => 100,
  getEncounterType: () => 'hostile',
  getReadingDifficultyFromLevel: () => 1,
}));

vi.mock('@/constants/gameData', () => ({
  SKILL_DATA: [
    { id: 'math', challengeType: 'math', fantasyName: 'Math' },
    { id: 'reading', challengeType: 'reading', fantasyName: 'Reading' },
    { id: 'memory', challengeType: 'memory', fantasyName: 'Memory' },
    { id: 'patterns', challengeType: 'patterns', fantasyName: 'Patterns' },
  ],
}));

vi.mock('@/utils/soundManager', () => ({
  playFail: vi.fn(),
  playLevelUp: vi.fn(),
  playNotification: vi.fn(),
  playSuccessfulHit: vi.fn(),
  playMobHurt: vi.fn(),
  playMobDeath: vi.fn(),
}));

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
        earnedBadges: [],
      },
    },
    setSkills: vi.fn(),
    stats: {},
    setStats: vi.fn(),
    battlingSkillId: 'math',
    setChallengeData: vi.fn(),
    setSpokenText: vi.fn(),
    checkAchievements: vi.fn(),
    setPlayerHealth: vi.fn(),
    generateChallenge: vi.fn().mockResolvedValue({ question: 'next' }),
    battleDifficulty: 1,
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

  /* ----------------------------- SUCCESS FLOW ----------------------------- */

  test('successful hit updates skills (damage + xp)', async () => {
    let updated;

    const setSkills = vi.fn((updater) => {
      updated = updater({
        math: {
          level: 1,
          xp: 0,
          mobHealth: 100,
          mobMaxHealth: 100,
          difficulty: 1,
          earnedBadges: [],
        },
      });
    });

    const { result } = createHook({ setSkills });

    await act(async () => {
      await result.current.handleSuccessHit('math');
    });

    expect(updated.math.mobHealth).toBeLessThan(100);
    expect(updated.math.xp).toBeGreaterThan(0);
  });

  /* ----------------------------- FAILURE FLOW ----------------------------- */

  test('wrong answer triggers failure side effects', async () => {
    const setPlayerHealth = vi.fn();
    const setStats = vi.fn();

    const { result } = createHook({
      setPlayerHealth,
      setStats,
    });

    await act(async () => {
      result.current.handleSuccessHit('math', 'WRONG');
    });

    expect(setPlayerHealth).toHaveBeenCalled();
    expect(setStats).toHaveBeenCalled();
  });

  /* ----------------------------- LEVELING ----------------------------- */

  test('level increases when xp exceeds threshold', async () => {
    let updated;

    const setSkills = vi.fn((updater) => {
      updated = updater({
        math: {
          level: 1,
          xp: 9999,
          mobHealth: 0,
          mobMaxHealth: 100,
          difficulty: 1,
          earnedBadges: [],
        },
      });
    });

    const { result } = createHook({ setSkills });

    await act(async () => {
      await result.current.handleSuccessHit('math');
    });

    expect(updated.math.level).toBeGreaterThan(1);
  });

  /* ----------------------------- VICTORY ----------------------------- */

test('kill transitions to VICTORY state', async () => {
  const { result } = createHook({
    skills: {
      math: {
        level: 1,
        xp: 0,
        mobHealth: 10, // lethal
        mobMaxHealth: 100,
        difficulty: 1,
      },
    },
  });

  // ✅ FORCE correct state
  act(() => {
    result.current.transition('IN_PROGRESS');
  });

  await act(async () => {
    await result.current.handleSuccessHit('math');
  });

  expect(result.current.battleState).toBe('VICTORY');
});

  /* ----------------------------- LOOP GAMES ----------------------------- */

  test('reading always loads next challenge', async () => {
    const generateChallenge = vi.fn().mockResolvedValue({ question: 'word' });
    const setChallengeData = vi.fn();

    const { result } = createHook({
      battlingSkillId: 'reading',
      generateChallenge,
      setChallengeData,
      skills: {
        reading: {
          level: 5,
          xp: 0,
          mobHealth: 100,
          mobMaxHealth: 100,
          difficulty: 1,
          earnedBadges: [],
        },
      },
    });

    await act(async () => {
      await result.current.handleSuccessHit('reading');
    });

    expect(generateChallenge).toHaveBeenCalled();
    expect(setChallengeData).toHaveBeenCalled();
  });

  /* ----------------------------- ASYNC FLOW ----------------------------- */

  test('loads next challenge after hit', async () => {
    const generateChallenge = vi.fn().mockResolvedValue({ question: 'next' });
    const setChallengeData = vi.fn();

    const { result } = createHook({
      generateChallenge,
      setChallengeData,
    });

    await act(async () => {
      await result.current.handleSuccessHit('math');
    });

    expect(generateChallenge).toHaveBeenCalled();
    expect(setChallengeData).toHaveBeenCalledWith(
      expect.objectContaining({ question: 'next' })
    );
  });

  /* ----------------------------- VISUAL EFFECTS ----------------------------- */

  test('adds damage numbers on hit', async () => {
    const { result } = createHook();

    await act(async () => {
      await result.current.handleSuccessHit('math');
    });

    expect(result.current.damageNumbers.length).toBeGreaterThan(0);
  });

  /* ----------------------------- FSM ----------------------------- */

  test('transition updates battle state', () => {
    const { result } = createHook();

    act(() => {
      result.current.transition('IN_PROGRESS');
    });

    expect(result.current.battleState).toBe('IN_PROGRESS');
  });
});

test('ignores outdated async challenge response', async () => {
  let resolveFirst;
  const slowPromise = new Promise(res => (resolveFirst = res));

  const generateChallenge = vi
    .fn()
    .mockReturnValueOnce(slowPromise)
    .mockResolvedValueOnce({ question: 'new' });

  const { result } = createHook({ generateChallenge });

  act(() => {
    result.current.handleSuccessHit('math');
    result.current.handleSuccessHit('math');
  });

  resolveFirst({ question: 'old' });

  await new Promise(r => setTimeout(r, 0));

  expect(generateChallenge).toHaveBeenCalledTimes(2);
});