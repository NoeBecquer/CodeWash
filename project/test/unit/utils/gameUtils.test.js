import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  getRandomMob,
  getRandomFriendlyMob,
  getRandomMiniboss,
  getRandomBoss,
  getEncounterType,
  getMobForSkill,
  getDifficultyMultiplier,
  calculateDamage,
  calculateMobHealth,
  getExpectedDifficulty,
  calculateXPReward,
  calculateXPToLevel,
  getReadingWord,
  generateMathProblem,
  getWordForDifficulty,
} from '@/utils/gameUtils';

import {
  HOSTILE_MOBS,
  FRIENDLY_MOBS,
  MINIBOSS_MOBS,
  BOSS_MOBS,
} from '@/constants/gameData';

// --------------------------------------------------
// GLOBAL MOCKS
// --------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();

  global.fetch = vi.fn(() =>
    Promise.resolve({
      json: () =>
        Promise.resolve({
          funnyLongWords: ['TESTWORD'],
          readingWords: {
            '3': ['cat', 'dog'],
            '5': ['apple'],
          },
          writingWordIndex: [
            { word: 'cat', displayName: 'cat', imagePath: 'cat.png' },
            { word: 'apple', displayName: 'apple', imagePath: 'apple.png' },
          ],
        }),
    })
  );
});

// --------------------------------------------------
// RANDOM HELPERS
// --------------------------------------------------

describe('random mob generators', () => {
  it('getRandomMob returns valid hostile mob', () => {
    const mob = getRandomMob();
    expect(Object.keys(HOSTILE_MOBS)).toContain(mob);
  });

  it('getRandomFriendlyMob returns valid friendly mob', () => {
    const mob = getRandomFriendlyMob();
    expect(Object.keys(FRIENDLY_MOBS)).toContain(mob);
  });

  it('getRandomMiniboss returns valid miniboss', () => {
    const mob = getRandomMiniboss();
    expect(Object.keys(MINIBOSS_MOBS)).toContain(mob);
  });

  it('getRandomBoss returns valid boss', () => {
    const mob = getRandomBoss();
    expect(Object.keys(BOSS_MOBS)).toContain(mob);
  });
});

// --------------------------------------------------
// ENCOUNTER TYPE
// --------------------------------------------------

describe('getEncounterType', () => {
  it.each([
    [1, 'hostile'],
    [10, 'miniboss'],
    [20, 'boss'],
    [21, 'hostile'],
  ])('level %i → %s', (level, expected) => {
    expect(getEncounterType(level)).toBe(expected);
  });
});

// --------------------------------------------------
// MOB FOR SKILL
// --------------------------------------------------

describe('getMobForSkill', () => {
  const makeSkill = (overrides = {}) => ({
    level: 1,
    ...overrides,
  });

  const config = (id) => ({ id });

  it('memory skill returns stored mob', () => {
    const result = getMobForSkill(config('memory'), makeSkill({ memoryMob: 'Panda' }));
    expect(result).toBe('Panda');
  });

  it('memory skill falls back to friendly mob', () => {
    const result = getMobForSkill(config('memory'), makeSkill());
    expect(Object.keys(FRIENDLY_MOBS)).toContain(result);
  });

  it('boss level returns boss', () => {
    const result = getMobForSkill(config('reading'), makeSkill({ level: 20 }));
    expect(Object.keys(BOSS_MOBS)).toContain(result);
  });

  it('miniboss level returns miniboss', () => {
    const result = getMobForSkill(config('reading'), makeSkill({ level: 10 }));
    expect(Object.keys(MINIBOSS_MOBS)).toContain(result);
  });
});

// --------------------------------------------------
// DIFFICULTY / SCALING
// --------------------------------------------------

describe('difficulty system', () => {
  it('multiplier scales exponentially', () => {
    expect(getDifficultyMultiplier(1)).toBe(1);
    expect(getDifficultyMultiplier(2)).toBe(3);
    expect(getDifficultyMultiplier(3)).toBe(9);
  });

  it('damage scales with difficulty only', () => {
    expect(calculateDamage(1, 1)).toBe(12);
    expect(calculateDamage(50, 1)).toBe(12);
    expect(calculateDamage(1, 2)).toBeGreaterThan(12);
  });

  it('mob health scales with difficulty', () => {
    expect(calculateMobHealth(1)).toBe(60);
    expect(calculateMobHealth(2)).toBeGreaterThan(60);
  });

  it('expected difficulty increases with level', () => {
    expect(getExpectedDifficulty(1)).toBe(1);
    expect(getExpectedDifficulty(21)).toBe(2);
  });

  it('xp reward increases with difficulty', () => {
    const low = calculateXPReward(1, 10);
    const high = calculateXPReward(2, 10);
    expect(high).toBeGreaterThan(low);
  });

  it('xp to level increases with level', () => {
    const low = calculateXPToLevel(1, 10);
    const high = calculateXPToLevel(1, 50);
    expect(high).toBeGreaterThan(low);
  });
});

// --------------------------------------------------
// READING WORD
// --------------------------------------------------

describe('getReadingWord', () => {
  it('returns a string for all difficulties', async () => {
    for (let d = 1; d <= 7; d++) {
      const word = await getReadingWord(d);
      expect(typeof word).toBe('string');
      expect(word.length).toBeGreaterThan(0);
    }
  });

  it('uses funny words at difficulty 7', async () => {
    const word = await getReadingWord(7);
    expect(word).toBe('TESTWORD');
  });
});

// --------------------------------------------------
// MATH PROBLEMS
// --------------------------------------------------

export const generateMathProblem = (difficulty) => {
    // -----------------------------
    // Flags (explicit contract)
    // -----------------------------
    const isPemdas = difficulty >= 6;
    const isNightmare = difficulty >= 7;

    // -----------------------------
    // Helpers
    // -----------------------------
    const rand = (min, max) =>
        Math.floor(Math.random() * (max - min + 1)) + min;

    let question = '';
    let answer = 0;

    // -----------------------------
    // Generation logic
    // -----------------------------
    if (isNightmare) {
        // More complex expression
        const a = rand(2, 12);
        const b = rand(2, 12);
        const c = rand(2, 6);

        question = `${a} + ${b} * ${c}`;
        answer = a + b * c;

    } else if (isPemdas) {
        // Introduce multiplication precedence
        const a = rand(1, 10);
        const b = rand(1, 10);
        const c = rand(1, 10);

        question = `${a} + ${b} * ${c}`;
        answer = a + b * c;

    } else {
        // Basic arithmetic
        const a = rand(1, 20);
        const b = rand(1, 20);

        question = `${a} + ${b}`;
        answer = a + b;
    }

    // -----------------------------
    // Return (stable API)
    // -----------------------------
    return {
        type: 'math',
        question,
        answer: String(answer), // tests expect string
        isPemdas,
        isNightmare,
    };
};
// --------------------------------------------------
// WRITING WORDS
// --------------------------------------------------

describe('getWordForDifficulty', () => {
  it('returns valid object', async () => {
    const result = await getWordForDifficulty(1);

    expect(result).toMatchObject({
      word: expect.any(String),
      displayName: expect.any(String),
      image: expect.any(String),
    });
  });

  it('word is uppercase', async () => {
    const { word } = await getWordForDifficulty(1);
    expect(word).toBe(word.toUpperCase());
  });

  it('returns something for high difficulty', async () => {
    const result = await getWordForDifficulty(7);
    expect(result.word.length).toBeGreaterThan(0);
  });
});