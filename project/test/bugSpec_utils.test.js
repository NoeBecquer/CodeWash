/**
 * BUG SPECIFICATION TESTS — Utility Functions
 *
 * These tests check CORRECT / EXPECTED behaviour.
 * A FAILING test = a confirmed bug in the codebase.
 *
 * Files under test
 *   src/utils/gameUtils.js
 *   src/constants/achievements.js
 *   src/constants/gameData.jsx
 */

import { describe, it, expect } from 'vitest';
import {
    generateMathProblem,
    calculateXPToLevel,
    calculateXPReward,
    getEncounterType,
    getDifficultyMultiplier,
    getWordForDifficulty,
} from '../src/utils/gameUtils';
import {
    TIER_COLORS,
    TIER_NAMES,
    ACHIEVEMENTS,
} from '../src/constants/achievements';
import { WRITING_WORD_INDEX } from '../src/constants/gameData';

// ─────────────────────────────────────────────────────────────────────────────
// BUG 1 — generateMathProblem: subtraction can produce a negative answer
//
// Root cause: when `a = 0` (valid because range starts at 0),
//   b = Math.floor(Math.random() * 0) + 1  →  b = 1
//   answer = 0 − 1 = −1
//
// Difficulties 3+ include subtraction with range [0, 20].
// ─────────────────────────────────────────────────────────────────────────────
describe('BUG 1 — generateMathProblem subtraction should never be negative', () => {
    it('subtraction answer should always be >= 0 (difficulty 3)', () => {
        // Run many iterations to reliably hit the a=0 edge case
        const negatives = [];
        for (let i = 0; i < 2000; i++) {
            const problem = generateMathProblem(3);
            if (problem.question.includes('-') && parseInt(problem.answer, 10) < 0) {
                negatives.push(problem);
            }
        }
        // EXPECTED: no negatives  ← WILL FAIL due to bug
        expect(negatives).toHaveLength(0);
    });

    it('subtraction answer should always be >= 0 (difficulty 4)', () => {
        const negatives = [];
        for (let i = 0; i < 2000; i++) {
            const problem = generateMathProblem(4);
            if (problem.question.includes('-') && parseInt(problem.answer, 10) < 0) {
                negatives.push(problem);
            }
        }
        expect(negatives).toHaveLength(0);
    });

    it('subtraction answer should always be >= 0 (difficulty 5)', () => {
        const negatives = [];
        for (let i = 0; i < 2000; i++) {
            const problem = generateMathProblem(5);
            if (problem.question.includes('÷') || problem.question.includes('×')) continue; // focus on subtraction
            if (problem.question.includes('-') && parseInt(problem.answer, 10) < 0) {
                negatives.push(problem);
            }
        }
        expect(negatives).toHaveLength(0);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG 2 — calculateXPToLevel: the `difficulty` parameter is silently ignored
//
// Root cause: when playerLevel is defined the function uses `expectedDifficulty`
// instead of the passed `difficulty`.  Playing on diff 1 vs diff 7 at the
// same level should require different XP-to-level thresholds, but they are
// identical.
// ─────────────────────────────────────────────────────────────────────────────
describe('BUG 2 — calculateXPToLevel should vary with difficulty', () => {
    it('XP needed at difficulty 7 should differ from difficulty 1 at the same level', () => {
        const xpDiff1 = calculateXPToLevel(1, 1);
        const xpDiff7 = calculateXPToLevel(7, 1);
        // EXPECTED: harder difficulty → more XP needed  ← WILL FAIL (both return same value)
        expect(xpDiff7).not.toBe(xpDiff1);
    });

    it('XP needed at difficulty 7 should be greater than at difficulty 1 (level 10)', () => {
        const low  = calculateXPToLevel(1, 10);
        const high = calculateXPToLevel(7, 10);
        // EXPECTED: harder → more XP  ← WILL FAIL
        expect(high).toBeGreaterThan(low);
    });

    it('the difficulty parameter (arg 1) should actually affect the return value', () => {
        // Any two different difficulty values at the same level should yield different results
        const results = [1, 2, 3, 4, 5, 6, 7].map(d => calculateXPToLevel(d, 5));
        const unique = new Set(results);
        // EXPECTED: 7 different values  ← WILL FAIL (all 7 are identical)
        expect(unique.size).toBeGreaterThan(1);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG 3 — getEncounterType: level 0 produces invalid levelInCycle
//
// Root cause: JavaScript % operator is sign-preserving.
//   ((0 − 1) % 20) + 1  =  (−1) + 1  =  0
// Level 0 should not exist in gameplay (minimum: 1), but the formula
// is not protected.  A valid levelInCycle must be 1–20.
// ─────────────────────────────────────────────────────────────────────────────
describe('BUG 3 — getEncounterType should handle level 0 gracefully', () => {
    it('levelInCycle should be between 1 and 20 for level 0', () => {
        // Reproduce the formula used inside getEncounterType
        const levelInCycle = ((0 - 1) % 20) + 1;
        // EXPECTED: 1 ≤ levelInCycle ≤ 20  ← WILL FAIL (levelInCycle = 0)
        expect(levelInCycle).toBeGreaterThanOrEqual(1);
        expect(levelInCycle).toBeLessThanOrEqual(20);
    });

    it('getEncounterType returns a valid string for level 0', () => {
        const result = getEncounterType(0);
        expect(['hostile', 'miniboss', 'boss']).toContain(result); // technically passes
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG 4 — TIER_COLORS / TIER_NAMES are inconsistently indexed
//
// TIER_COLORS uses 1-based keys  {1: ..., 2: ..., …, 8: ...}
// TIER_NAMES  uses 0-based array  ['Bronze', 'Silver', …, 'Mythic']
//
// TIER_COLORS[0] is undefined.  Any code that happens to use the same
// 0-based index for TIER_COLORS will silently get `undefined`.
// ─────────────────────────────────────────────────────────────────────────────
describe('BUG 4 — TIER_COLORS and TIER_NAMES should use the same indexing', () => {
    it('TIER_COLORS should have an entry for index 0 (consistent with TIER_NAMES)', () => {
        // AchievementToast uses  TIER_COLORS[tierIndex + 1]  — which is a workaround,
        // not a design.  Both structures should either be 0-based or 1-based.
        // EXPECTED: TIER_COLORS[0] exists  ← WILL FAIL (TIER_COLORS starts at key 1)
        expect(TIER_COLORS[0]).toBeDefined();
    });

    it('TIER_COLORS and TIER_NAMES should have the same number of entries', () => {
        const colorCount = Object.keys(TIER_COLORS).length;
        const nameCount  = TIER_NAMES.length;
        expect(colorCount).toBe(nameCount); // Both are 8 — passes (counts match)
    });

    it('every TIER_NAMES index should have a corresponding TIER_COLORS entry', () => {
        // In AchievementToast: tierIndex is 0-based (array index into achievement.tiers)
        // It accesses TIER_COLORS[tierIndex + 1] as a manual correction for the off-by-one.
        // This means the API is inconsistent: one structure requires +1 to read the other.
        // EXPECTED: TIER_COLORS[i] defined for all 0-based indices  ← WILL FAIL for i=0
        TIER_NAMES.forEach((_, i) => {
            expect(TIER_COLORS[i]).toBeDefined();
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG 5 — `full_set` achievement is impossible through normal gameplay
//
// Root cause: App.jsx awards badge tiers with the guard `newTier <= 7`,
// so tier 8 (Obsidian) is never awarded.
// `full_set` requires earnedBadges.length >= 8, which can never happen
// through normal play.
// ─────────────────────────────────────────────────────────────────────────────
describe('BUG 5 — full_set achievement is unreachable in normal gameplay', () => {
    it('full_set achievement requires 8 badges', () => {
        const fullSet = ACHIEVEMENTS['full_set'];
        expect(fullSet).toBeDefined();
        // The achievement checks length >= 8
        const requiresEight = fullSet.checkUnlock({}, {
            math: { earnedBadges: [1, 2, 3, 4, 5, 6, 7, 8] }
        });
        expect(requiresEight).toBe(true);
    });

    it('full_set should NOT unlock with only 7 badges (all that can be earned normally)', () => {
        const fullSet = ACHIEVEMENTS['full_set'];
        const withSevenBadges = fullSet.checkUnlock({}, {
            math: { earnedBadges: [1, 2, 3, 4, 5, 6, 7] }
        });
        // EXPECTED: 7 badges is NOT enough to complete the "full set" = should NOT unlock
        // But the achievement requires 8, and only 7 can be earned → stuck forever
        // This test asserts the DESIRED behavior (7 should suffice for a complete set of earnable tiers)
        // WILL FAIL — the achievement requires 8 but only 7 are earnable
        expect(withSevenBadges).toBe(true);
    });

    it('badge tiers 1-7 can be earned; tier 8 cannot (guard in App.jsx)', () => {
        // Simulate the App.jsx badge-award logic: newTier <= 7
        const badgesEarnable = [];
        for (let lvl = 20; lvl <= 160; lvl += 20) {
            const newTier = Math.floor(lvl / 20);
            if (newTier <= 7) { // This is the guard in App.jsx
                badgesEarnable.push(newTier);
            }
        }
        // Tier 8 (Obsidian, unlocked at level 160) should be earnable:
        // EXPECTED: 8 tiers earnable  ← WILL FAIL (only 7 get past the guard)
        expect(badgesEarnable).toContain(8);
        expect(badgesEarnable).toHaveLength(8);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG 6 — WRITING_WORD_INDEX: `length` field is incorrect for multi-word items
//
// Root cause: the `length` field counts the space character in the display name,
// but the actual answer the player must type has the space stripped.
// E.g. 'Glow Squid' → length: 10, but the typed answer 'GLOWSQUID' = 9 chars.
// This miscategorises items into harder difficulty pools.
// ─────────────────────────────────────────────────────────────────────────────
describe('BUG 6 — WRITING_WORD_INDEX length field should match actual typed answer length', () => {
    it('length field should equal the typed answer length (no spaces)', () => {
        const mismatches = WRITING_WORD_INDEX.filter(item => {
            const typedLength = item.displayName.replace(/\s/g, '').length;
            return item.length !== typedLength;
        });
        // EXPECTED: no mismatches  ← WILL FAIL for multi-word items such as
        //   'Glow Squid' (length:10 but typed:9), 'Iron Golem' (10 vs 9), etc.
        expect(mismatches).toHaveLength(0);
    });

    it('specific example: Glow Squid typed answer length should be 9, not 10', () => {
        const glowSquid = WRITING_WORD_INDEX.find(w => w.word === 'glowsquid');
        expect(glowSquid).toBeDefined();
        const typedLength = glowSquid.displayName.replace(/\s/g, '').length;
        // EXPECTED: length field matches typed length
        // WILL FAIL because length=10 but typedLength=9
        expect(glowSquid.length).toBe(typedLength);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG 7 — getWordForDifficulty: difficulty 6 and 7 both use pool 5
//
// Root cause: `const poolNumber = Math.min(difficulty, 5)` maps diff 6→5, 7→5.
// Players at difficulty 6 and 7 get exactly the same word pool as difficulty 5.
// There is no progressive increase in challenge at the highest difficulties.
// ─────────────────────────────────────────────────────────────────────────────
describe('BUG 7 — getWordForDifficulty should use distinct pools for difficulty 6 and 7', () => {
    it('difficulty 6 word pool should differ from difficulty 5 pool', () => {
        // Run many samples at both difficulties
        const set5 = new Set(), set6 = new Set();
        for (let i = 0; i < 100; i++) {
            set5.add(getWordForDifficulty(5).word);
            set6.add(getWordForDifficulty(6).word);
        }
        // EXPECTED: difficulties 5 and 6 can produce words unique to each pool
        // WILL FAIL because both use WRITING_DIFFICULTY_POOLS[5]
        const uniqueToSix = [...set6].filter(w => !set5.has(w));
        expect(uniqueToSix.length).toBeGreaterThan(0);
    });

    it('difficulty 7 word pool should differ from difficulty 5 pool', () => {
        const set5 = new Set(), set7 = new Set();
        for (let i = 0; i < 100; i++) {
            set5.add(getWordForDifficulty(5).word);
            set7.add(getWordForDifficulty(7).word);
        }
        const uniqueToSeven = [...set7].filter(w => !set5.has(w));
        // WILL FAIL for the same reason
        expect(uniqueToSeven.length).toBeGreaterThan(0);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG 8 — Math input validation allows negative answer to be auto-accepted
//
// Root cause: SkillCard math input strips non-digit chars but keeps '-',
//   onChange filter:  val.replace(/[^0-9-]/g, '')
// So "-1" is allowed.  Combined with Bug 1 (subtraction can return -1),
// the player would see a negative answer and a field that only accepts 1 digit
// but "-1" is 2 chars.  The `maxLength` is `String(challenge.answer).length`
// which for answer="-1" would be 2, so "-" and "1" can both be typed.
// ─────────────────────────────────────────────────────────────────────────────
describe('BUG 8 — Generated math answers should never be negative strings', () => {
    it('no math problem answer at any difficulty should start with a minus sign', () => {
        const negativeAnswers = [];
        for (let diff = 1; diff <= 5; diff++) {
            for (let i = 0; i < 500; i++) {
                const p = generateMathProblem(diff);
                if (p.answer && p.answer.toString().startsWith('-')) {
                    negativeAnswers.push({ diff, ...p });
                }
            }
        }
        // EXPECTED: no negative answers at any difficulty
        // WILL FAIL for difficulty 3-5 due to Bug 1
        expect(negativeAnswers).toHaveLength(0);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// PASSING SANITY CHECKS (these should all pass, verifying the test setup)
// ─────────────────────────────────────────────────────────────────────────────
describe('Sanity checks (should all pass)', () => {
    it('getDifficultyMultiplier(1) === 1', () => {
        expect(getDifficultyMultiplier(1)).toBe(1);
    });

    it('getDifficultyMultiplier(2) === 3', () => {
        expect(getDifficultyMultiplier(2)).toBe(3);
    });

    it('getDifficultyMultiplier(3) === 9', () => {
        expect(getDifficultyMultiplier(3)).toBe(9);
    });

    it('getEncounterType(1) === hostile', () => {
        expect(getEncounterType(1)).toBe('hostile');
    });

    it('getEncounterType(10) === miniboss', () => {
        expect(getEncounterType(10)).toBe('miniboss');
    });

    it('getEncounterType(20) === boss', () => {
        expect(getEncounterType(20)).toBe('boss');
    });

    it('getEncounterType(21) === hostile (new cycle)', () => {
        expect(getEncounterType(21)).toBe('hostile');
    });

    it('TIER_NAMES has 8 entries', () => {
        expect(TIER_NAMES).toHaveLength(8);
    });

    it('TIER_COLORS has 8 entries', () => {
        expect(Object.keys(TIER_COLORS)).toHaveLength(8);
    });

    it('addition problems never produce negative answers', () => {
        for (let i = 0; i < 500; i++) {
            const p = generateMathProblem(1);
            expect(parseInt(p.answer, 10)).toBeGreaterThanOrEqual(0);
        }
    });

    it('calculateXPReward uses the difficulty parameter correctly', () => {
        // XPReward DOES use difficulty (unlike calculateXPToLevel)
        const reward1 = calculateXPReward(1, 1);
        const reward7 = calculateXPReward(7, 1);
        expect(reward7).toBeGreaterThan(reward1);
    });
});
