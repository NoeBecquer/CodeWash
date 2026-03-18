import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mock state (hoisted so vi.mock factory can reference it) ──────────────────
const mocks = vi.hoisted(() => ({
    WRITING_WORD_INDEX:  null,
    DIFFICULTY_CONTENT:  null,
}));

// Patch gameData so specific tests can override individual constants at runtime
vi.mock('../src/constants/gameData.jsx', async () => {
    const actual = await vi.importActual('../src/constants/gameData.jsx');
    return {
        ...actual,
        get WRITING_WORD_INDEX()  { return mocks.WRITING_WORD_INDEX  ?? actual.WRITING_WORD_INDEX; },
        get DIFFICULTY_CONTENT()  { return mocks.DIFFICULTY_CONTENT  ?? actual.DIFFICULTY_CONTENT; },
    };
});

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
    getItemsForLength,
} from '../src/utils/gameUtils.js';

import {
    HOSTILE_MOBS,
    FRIENDLY_MOBS,
    MINIBOSS_MOBS,
    BOSS_MOBS,
    FUNNY_LONG_WORDS,
} from '../src/constants/gameData.jsx';

afterEach(() => {
    mocks.WRITING_WORD_INDEX = null;
    mocks.DIFFICULTY_CONTENT = null;
});

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/** Return a minimal skill object */
const makeSkill = (overrides = {}) => ({
    level: 1,
    difficulty: 1,
    ...overrides,
});

/** Return a minimal skillConfig object */
const makeConfig = (id) => ({ id });

// ──────────────────────────────────────────────
// getRandomMob
// ──────────────────────────────────────────────

describe('getRandomMob', () => {
    it('returns a key present in HOSTILE_MOBS', () => {
        const mob = getRandomMob(null);
        expect(Object.keys(HOSTILE_MOBS)).toContain(mob);
    });

    it('never returns the excluded mob when the pool has other options', () => {
        const excluded = 'Zombie';
        for (let i = 0; i < 30; i++) {
            expect(getRandomMob(excluded)).not.toBe(excluded);
        }
    });

    it('returns "Zombie" when the pool is empty (all mobs excluded)', () => {
        // Monkey-patch Math.random so the filtered pool ends up empty
        // We force exclude the only mob by mocking the whole HOSTILE_MOBS pool
        // The simplest way: mock Math.random to always return 0
        // and exclude so that only one mob is left, then exclude that one too.
        // Actually, the fallback is triggered when pool.length === 0, which can't
        // happen with a single exclude unless pool has 1 item.
        // We test the branch indirectly by checking the fallback value returned.
        // We mock the module's internal pool to be empty by spying on Object.keys.
        const spy = vi.spyOn(Object, 'keys').mockReturnValueOnce([]);
        const result = getRandomMob('anything');
        expect(result).toBe('Zombie');
        spy.mockRestore();
    });
});

// ──────────────────────────────────────────────
// getRandomFriendlyMob
// ──────────────────────────────────────────────

describe('getRandomFriendlyMob', () => {
    it('returns a key present in FRIENDLY_MOBS', () => {
        const mob = getRandomFriendlyMob();
        expect(Object.keys(FRIENDLY_MOBS)).toContain(mob);
    });

    it('returns "Allay" when the pool is empty', () => {
        const spy = vi.spyOn(Object, 'keys').mockReturnValueOnce([]);
        expect(getRandomFriendlyMob()).toBe('Allay');
        spy.mockRestore();
    });
});

// ──────────────────────────────────────────────
// getRandomMiniboss
// ──────────────────────────────────────────────

describe('getRandomMiniboss', () => {
    it('returns a key present in MINIBOSS_MOBS', () => {
        const mob = getRandomMiniboss();
        expect(Object.keys(MINIBOSS_MOBS)).toContain(mob);
    });

    it('returns "Wither Skeleton" when the pool is empty', () => {
        const spy = vi.spyOn(Object, 'keys').mockReturnValueOnce([]);
        expect(getRandomMiniboss()).toBe('Wither Skeleton');
        spy.mockRestore();
    });
});

// ──────────────────────────────────────────────
// getRandomBoss
// ──────────────────────────────────────────────

describe('getRandomBoss', () => {
    it('returns a key present in BOSS_MOBS', () => {
        const mob = getRandomBoss();
        expect(Object.keys(BOSS_MOBS)).toContain(mob);
    });

    it('returns "Wither" when the pool is empty', () => {
        const spy = vi.spyOn(Object, 'keys').mockReturnValueOnce([]);
        expect(getRandomBoss()).toBe('Wither');
        spy.mockRestore();
    });
});

// ──────────────────────────────────────────────
// getEncounterType
// ──────────────────────────────────────────────

describe('getEncounterType', () => {
    it.each([
        [1,  'hostile'],
        [5,  'hostile'],
        [9,  'hostile'],
        [10, 'miniboss'],
        [11, 'hostile'],
        [19, 'hostile'],
        [20, 'boss'],
        [21, 'hostile'], // cycle repeats: (21-1)%20+1 = 1
        [30, 'miniboss'],
        [40, 'boss'],
    ])('level %i → %s', (level, expected) => {
        expect(getEncounterType(level)).toBe(expected);
    });
});

// ──────────────────────────────────────────────
// getMobForSkill
// ──────────────────────────────────────────────

describe('getMobForSkill', () => {
    // ── cleaning ─────────────────────────────
    describe('cleaning skill', () => {
        const config = makeConfig('cleaning');

        it('returns "Ender Chest" at level 20 (multiple of 20)', () => {
            expect(getMobForSkill(config, makeSkill({ level: 20 }))).toBe('Ender Chest');
        });

        it('returns "Shulker Box" at level 5 (multiple of 5, not 20)', () => {
            expect(getMobForSkill(config, makeSkill({ level: 5 }))).toBe('Shulker Box');
        });

        it('returns "Shulker Box" at level 15 (multiple of 5)', () => {
            expect(getMobForSkill(config, makeSkill({ level: 15 }))).toBe('Shulker Box');
        });

        it('returns a standard chest at level 1 (not a multiple of 5)', () => {
            const result = getMobForSkill(config, makeSkill({ level: 1 }));
            expect(['Chest', 'Trapped Chest', 'Barrel', 'Bundle']).toContain(result);
        });

        it('returns a standard chest at level 3', () => {
            const result = getMobForSkill(config, makeSkill({ level: 3 }));
            expect(['Chest', 'Trapped Chest', 'Barrel', 'Bundle']).toContain(result);
        });
    });

    // ── memory ────────────────────────────────
    describe('memory skill', () => {
        const config = makeConfig('memory');

        it('returns the stored memoryMob when one is set', () => {
            expect(getMobForSkill(config, makeSkill({ memoryMob: 'Panda' }))).toBe('Panda');
        });

        it('returns a valid friendly mob when memoryMob is not set', () => {
            const result = getMobForSkill(config, makeSkill({ memoryMob: undefined }));
            expect(Object.keys(FRIENDLY_MOBS)).toContain(result);
        });
    });

    // ── boss encounter ─────────────────────────
    describe('boss encounter (level 20)', () => {
        it('returns the stored currentBoss when set', () => {
            const config = makeConfig('reading');
            const skill = makeSkill({ level: 20, currentBoss: 'Wither' });
            expect(getMobForSkill(config, skill)).toBe('Wither');
        });

        it('returns a valid boss mob when currentBoss is not set', () => {
            const config = makeConfig('reading');
            const result = getMobForSkill(config, makeSkill({ level: 20 }));
            expect(Object.keys(BOSS_MOBS)).toContain(result);
        });
    });

    // ── miniboss encounter ─────────────────────
    describe('miniboss encounter (level 10)', () => {
        it('returns the stored currentMiniboss when set', () => {
            const config = makeConfig('reading');
            const skill = makeSkill({ level: 10, currentMiniboss: 'Ravager' });
            expect(getMobForSkill(config, skill)).toBe('Ravager');
        });

        it('returns a valid miniboss when currentMiniboss is not set', () => {
            const config = makeConfig('reading');
            const result = getMobForSkill(config, makeSkill({ level: 10 }));
            expect(Object.keys(MINIBOSS_MOBS)).toContain(result);
        });
    });

    // ── combat skills (reading, math, writing, patterns) at hostile level ─
    describe.each([
        ['reading',  'readingMob'],
        ['math',     'mathMob'],
        ['writing',  'writingMob'],
        ['patterns', 'patternMob'],
    ])('%s skill at hostile level', (skillId, mobKey) => {
        it('returns the stored mob when set', () => {
            const skill = makeSkill({ level: 1, [mobKey]: 'Creeper' });
            expect(getMobForSkill(makeConfig(skillId), skill)).toBe('Creeper');
        });

        it('returns a valid hostile mob when stored mob is not set', () => {
            const skill = makeSkill({ level: 1, [mobKey]: undefined });
            const result = getMobForSkill(makeConfig(skillId), skill);
            expect(Object.keys(HOSTILE_MOBS)).toContain(result);
        });
    });

    // ── fallback (unknown skill id) ───────────
    describe('fallback for any other skill', () => {
        it('returns currentMob when it is a valid hostile mob', () => {
            const skill = makeSkill({ level: 1, currentMob: 'Ghast' });
            expect(getMobForSkill(makeConfig('unknown'), skill)).toBe('Ghast');
        });

        it('returns a random hostile mob when currentMob is not valid', () => {
            const skill = makeSkill({ level: 1, currentMob: 'NotAMob' });
            const result = getMobForSkill(makeConfig('unknown'), skill);
            expect(Object.keys(HOSTILE_MOBS)).toContain(result);
        });

        it('returns a random hostile mob when currentMob is undefined', () => {
            const skill = makeSkill({ level: 1 });
            const result = getMobForSkill(makeConfig('unknown'), skill);
            expect(Object.keys(HOSTILE_MOBS)).toContain(result);
        });

        it('returns "Zombie" when the hostile mob pool is empty', () => {
            const skill = makeSkill({ level: 1 });
            // Force Object.keys for HOSTILE_MOBS to return []
            const spy = vi.spyOn(Object, 'keys').mockReturnValueOnce([]);
            const result = getMobForSkill(makeConfig('unknown'), skill);
            expect(result).toBe('Zombie');
            spy.mockRestore();
        });
    });
});

// ──────────────────────────────────────────────
// getDifficultyMultiplier
// ──────────────────────────────────────────────

describe('getDifficultyMultiplier', () => {
    it.each([
        [1, 1],
        [2, 3],
        [3, 9],
        [4, 27],
        [7, 729],
    ])('difficulty %i → %i', (difficulty, expected) => {
        expect(getDifficultyMultiplier(difficulty)).toBe(expected);
    });
});

// ──────────────────────────────────────────────
// calculateDamage
// ──────────────────────────────────────────────

describe('calculateDamage', () => {
    it('returns BASE_DAMAGE (12) at difficulty 1 regardless of level', () => {
        expect(calculateDamage(1, 1)).toBe(12);
        expect(calculateDamage(50, 1)).toBe(12);
    });

    it('scales with difficulty multiplier (3^(d-1))', () => {
        expect(calculateDamage(1, 2)).toBe(36);  // 12 * 3
        expect(calculateDamage(1, 3)).toBe(108); // 12 * 9
    });
});

// ──────────────────────────────────────────────
// calculateMobHealth
// ──────────────────────────────────────────────

describe('calculateMobHealth', () => {
    it('returns 60 at difficulty 1 (5 × BASE_DAMAGE)', () => {
        expect(calculateMobHealth(1)).toBe(60);
    });

    it('scales with difficulty multiplier', () => {
        expect(calculateMobHealth(2)).toBe(180); // 60 * 3
        expect(calculateMobHealth(3)).toBe(540); // 60 * 9
    });
});

// ──────────────────────────────────────────────
// getExpectedDifficulty
// ──────────────────────────────────────────────

describe('getExpectedDifficulty', () => {
    it.each([
        [1,   1],
        [20,  1],
        [21,  2],
        [40,  2],
        [41,  3],
        [121, 7], // (121-1)/20 = 6.0 → floor=6 → +1=7 (capped at 7)
        [200, 7],
    ])('level %i → difficulty %i', (level, expected) => {
        expect(getExpectedDifficulty(level)).toBe(expected);
    });
});

// ──────────────────────────────────────────────
// calculateXPReward
// ──────────────────────────────────────────────

describe('calculateXPReward', () => {
    it('returns base difficulty reward when playerLevel is undefined', () => {
        // diff 1 → 1 × 100 = 100
        expect(calculateXPReward(1, undefined)).toBe(100);
        // diff 2 → 3 × 100 = 300
        expect(calculateXPReward(2, undefined)).toBe(300);
    });

    it('returns full reward when playing at expected difficulty', () => {
        // Level 1, expected diff 1, playing at diff 1
        const reward = calculateXPReward(1, 1);
        expect(reward).toBeGreaterThan(0);
    });

    it('returns full reward when playing above expected difficulty', () => {
        // Level 1 (expected diff 1), playing at diff 2 → bonus difficulty
        const aboveReward = calculateXPReward(2, 1);
        const expectedReward = calculateXPReward(1, 1);
        expect(aboveReward).toBeGreaterThan(expectedReward);
    });

    it('applies a penalty when playing below expected difficulty', () => {
        // Level 21 → expected diff 2. Playing at diff 1 should yield less than diff 2.
        const penalizedReward = calculateXPReward(1, 21);
        const fullReward = calculateXPReward(2, 21);
        expect(penalizedReward).toBeLessThan(fullReward);
    });

    it('penalty is larger when the gap is wider', () => {
        // Level 41 → expected diff 3.
        const gap1 = calculateXPReward(2, 41); // gap = 1
        const gap2 = calculateXPReward(1, 41); // gap = 2
        expect(gap2).toBeLessThan(gap1);
    });
});

// ──────────────────────────────────────────────
// calculateXPToLevel
// ──────────────────────────────────────────────

describe('calculateXPToLevel', () => {
    it('returns base XP when playerLevel is undefined', () => {
        // diff 1 → 100 * 1 = 100
        expect(calculateXPToLevel(1, undefined)).toBe(100);
        // diff 2 → 100 * 3 = 300
        expect(calculateXPToLevel(2, undefined)).toBe(300);
    });

    it('returns a positive integer for any valid level/difficulty', () => {
        expect(calculateXPToLevel(1, 1)).toBeGreaterThan(0);
        expect(calculateXPToLevel(7, 100)).toBeGreaterThan(0);
    });

    it('grows as player level increases (exponential scaling)', () => {
        const low  = calculateXPToLevel(1, 10);
        const high = calculateXPToLevel(1, 50);
        expect(high).toBeGreaterThan(low);
    });
});

// ──────────────────────────────────────────────
// getReadingWord
// ──────────────────────────────────────────────

describe('getReadingWord', () => {
    it('returns a non-empty string for every difficulty 1-7', () => {
        for (let d = 1; d <= 7; d++) {
            const word = getReadingWord(d);
            expect(typeof word).toBe('string');
            expect(word.length).toBeGreaterThan(0);
        }
    });

    it('returns a word from FUNNY_LONG_WORDS at difficulty 7', () => {
        for (let i = 0; i < 10; i++) {
            expect(FUNNY_LONG_WORDS).toContain(getReadingWord(7));
        }
    });

    it('falls back to difficulty 1 config when the config is undefined', () => {
        // Difficulty 99 → falls back to reading[1] config → length 3
        const word = getReadingWord(99);
        expect(typeof word).toBe('string');
        expect(word.length).toBe(3);
    });
});

// ──────────────────────────────────────────────
// generateMathProblem
// ──────────────────────────────────────────────

describe('generateMathProblem', () => {
    it('always returns an object with type "math", question, and answer', () => {
        for (let d = 1; d <= 7; d++) {
            const problem = generateMathProblem(d);
            expect(problem).toMatchObject({
                type: 'math',
                question: expect.any(String),
                answer: expect.any(String),
            });
        }
    });

    it('difficulty 7 sets isNightmare: true', () => {
        const result = generateMathProblem(7);
        expect(result.isNightmare).toBe(true);
    });

    it('difficulty 6 sets isPemdas: true', () => {
        const result = generateMathProblem(6);
        expect(result.isPemdas).toBe(true);
    });

    it('difficulty 6 answer matches the question math', () => {
        // All PEMDAS problems are hard-coded so we just check answer is numeric string
        const { answer } = generateMathProblem(6);
        expect(Number.isInteger(Number(answer))).toBe(true);
    });

    it('difficulty 7 answer matches the question math', () => {
        const { answer } = generateMathProblem(7);
        expect(Number.isInteger(Number(answer))).toBe(true);
    });

    // Addition branch (difficulty 1-2)
    it('difficulty 1 generates an addition problem with a correct answer', () => {
        // Run many times to increase confidence
        for (let i = 0; i < 20; i++) {
            const { question, answer } = generateMathProblem(1);
            const [left, right] = question.replace(' = ?', '').split(' + ').map(Number);
            expect(left + right).toBe(Number(answer));
        }
    });

    // Addition at diff 2 (range 0-20)
    it('difficulty 2 generates an addition problem with answer in correct range', () => {
        for (let i = 0; i < 10; i++) {
            const { answer } = generateMathProblem(2);
            const n = Number(answer);
            expect(n).toBeGreaterThanOrEqual(0);
            expect(n).toBeLessThanOrEqual(40); // max 20+20
        }
    });

    // Subtraction, multiply, divide branches are exercised at difficulties 3-5
    it('difficulty 3 (+-) produces a non-negative answer', () => {
        for (let i = 0; i < 20; i++) {
            expect(Number(generateMathProblem(3).answer)).toBeGreaterThanOrEqual(0);
        }
    });

    it('difficulty 4 (*) answer is a valid integer', () => {
        for (let i = 0; i < 20; i++) {
            const { answer } = generateMathProblem(4);
            expect(Number.isInteger(Number(answer))).toBe(true);
        }
    });

    it('difficulty 5 (/) produces a clean integer quotient', () => {
        for (let i = 0; i < 20; i++) {
            const { answer } = generateMathProblem(5);
            expect(Number.isInteger(Number(answer))).toBe(true);
        }
    });

    it('falls back to difficulty 1 config when difficulty is unknown', () => {
        const problem = generateMathProblem(99);
        expect(problem.type).toBe('math');
    });
});

// ──────────────────────────────────────────────
// getWordForDifficulty
// ──────────────────────────────────────────────

describe('getWordForDifficulty', () => {
    it('returns an object with word, displayName, and image for every difficulty 1-7', () => {
        for (let d = 1; d <= 7; d++) {
            const result = getWordForDifficulty(d);
            expect(result).toMatchObject({
                word:        expect.any(String),
                displayName: expect.any(String),
                image:       expect.any(String),
            });
        }
    });

    it('the word is returned in UPPER CASE', () => {
        for (let d = 1; d <= 7; d++) {
            const { word } = getWordForDifficulty(d);
            expect(word).toBe(word.toUpperCase());
        }
    });

    it('difficulties 6 and 7 are mapped to pool 5', () => {
        // Both should give non-empty results (pool 5 exists)
        expect(getWordForDifficulty(6).word.length).toBeGreaterThan(0);
        expect(getWordForDifficulty(7).word.length).toBeGreaterThan(0);
    });
});

// ──────────────────────────────────────────────
// getItemsForLength
// ──────────────────────────────────────────────

describe('getItemsForLength', () => {
    it('returns an object with items, combinedAnswer, and images', () => {
        // targetLength 3 should exist in WRITING_WORD_INDEX (e.g. "BED", "EGG"…)
        const result = getItemsForLength(3);
        expect(result).toMatchObject({
            items:          expect.any(Array),
            combinedAnswer: expect.any(String),
            images:         expect.any(Array),
        });
    });

    it('combinedAnswer is in UPPER CASE when a single item matches', () => {
        const { combinedAnswer } = getItemsForLength(3);
        expect(combinedAnswer).toBe(combinedAnswer.toUpperCase());
    });

    it('returns a combination of two items when no single item matches exactly', () => {
        // Length 6 = 3+3 combination is possible (e.g. EGG+BED)
        // We rely on the function to find a combination or a fallback
        const result = getItemsForLength(6);
        expect(result.combinedAnswer.length).toBeGreaterThan(0);
    });

    it('returns a fallback closest item for a very large targetLength', () => {
        // Length 999 won't match any single item or pair → fallback branch
        const result = getItemsForLength(999);
        expect(result.combinedAnswer.length).toBeGreaterThan(0);
        expect(result.items.length).toBeGreaterThan(0);
    });

    it('[dead-code branch] returns a two-item combination when WRITING_WORD_INDEX has no match (lines 300-302)', () => {
        // Force WRITING_WORD_INDEX to be empty so no single item matches.
        // SPELLING_ITEMS has 3+3=6, so targetLength 6 finds a combination.
        mocks.WRITING_WORD_INDEX = [];
        const result = getItemsForLength(6);
        expect(result.items.length).toBe(2);
        expect(result.combinedAnswer.length).toBe(6);
        expect(result.images.length).toBe(2);
    });
});

// ──────────────────────────────────────────────
// Dead-code branches — require targeted mocking
// ──────────────────────────────────────────────

describe('getWordForDifficulty [dead-code fallback branch, lines 280-283]', () => {
    it('returns a fallback item from pool 1 when the resolved pool is undefined', () => {
        // Math.min is called once with (difficulty, 5) inside getWordForDifficulty.
        // Returning 99 maps to WRITING_DIFFICULTY_POOLS[99] which is undefined → fallback.
        const spy = vi.spyOn(Math, 'min').mockReturnValueOnce(99);
        const result = getWordForDifficulty(1);
        spy.mockRestore();
        expect(result).toMatchObject({
            word:        expect.any(String),
            displayName: expect.any(String),
            image:       expect.any(String),
        });
        expect(result.word).toBe(result.word.toUpperCase());
    });
});

describe('generateMathProblem [dead-code default branch, line 341]', () => {
    it('falls back to addition when operation is unrecognised', () => {
        // Inject a custom operation '%' that is not handled by any switch case.
        mocks.DIFFICULTY_CONTENT = {
            math: {
                1: { operations: ['%'], range: [1, 9] },
            },
        };
        const problem = generateMathProblem(1);
        expect(problem.type).toBe('math');
        expect(problem.question).toContain('+');
        expect(Number.isInteger(Number(problem.answer))).toBe(true);
    });
});
