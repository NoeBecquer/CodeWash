import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    getDefaultStats,
    isAchievementUnlocked,
    getCurrentTier,
    getNextTier,
    getTierProgress,
    getNewlyUnlockedAchievements,
    getNewTierAchievements,
    addUniqueToArray,
    recordLoginDate,
    getAchievementDisplayName,
} from '../src/utils/achievementUtils.js';

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/**
 * Build a mock skills object where every skill has the same values.
 * Mirrors the shape expected by ACHIEVEMENTS.getProgress / checkUnlock.
 */
const makeSkills = (level = 1, difficulty = 1, earnedBadges = []) => ({
    attack:   { level, difficulty, earnedBadges: [...earnedBadges] },
    defense:  { level, difficulty, earnedBadges: [...earnedBadges] },
    magic:    { level, difficulty, earnedBadges: [...earnedBadges] },
    agility:  { level, difficulty, earnedBadges: [...earnedBadges] },
    luck:     { level, difficulty, earnedBadges: [...earnedBadges] },
    charisma: { level, difficulty, earnedBadges: [...earnedBadges] },
});

// ──────────────────────────────────────────────
// getDefaultStats
// ──────────────────────────────────────────────

describe('getDefaultStats', () => {
    it('returns the expected default structure', () => {
        expect(getDefaultStats()).toEqual({
            phantomsCaught: 0,
            totalMobsDefeated: 0,
            totalBossesDefeated: 0,
            totalMinibossesDefeated: 0,
            totalDeaths: 0,
            uniqueMobsDefeated: [],
            uniqueBossesDefeated: [],
            uniqueMinibossesDefeated: [],
            themeChanges: 0,
            borderChanges: 0,
            battlesThisSession: 0,
            loginDates: [],
            perfectMemoryGames: 0,
            achievementsUnlocked: [],
        });
    });

    it('returns a fresh object on each call (no shared reference)', () => {
        const a = getDefaultStats();
        const b = getDefaultStats();
        expect(a).not.toBe(b);
    });
});

// ──────────────────────────────────────────────
// isAchievementUnlocked
// ──────────────────────────────────────────────

describe('isAchievementUnlocked', () => {
    it('returns false for an unknown achievement ID', () => {
        expect(isAchievementUnlocked('unknown_id', getDefaultStats(), makeSkills())).toBe(false);
    });

    // Tiered achievements ──────────────────────
    it('returns false for a tiered achievement when progress is below tier 1', () => {
        const stats = { ...getDefaultStats(), phantomsCaught: 0 };
        expect(isAchievementUnlocked('phantom_hunter', stats, makeSkills())).toBe(false);
    });

    it('returns true for a tiered achievement when progress meets tier 1', () => {
        const stats = { ...getDefaultStats(), phantomsCaught: 5 };
        expect(isAchievementUnlocked('phantom_hunter', stats, makeSkills())).toBe(true);
    });

    it('returns true for a tiered achievement when progress exceeds tier 1', () => {
        const stats = { ...getDefaultStats(), phantomsCaught: 50 };
        expect(isAchievementUnlocked('phantom_hunter', stats, makeSkills())).toBe(true);
    });

    // One-time achievements ────────────────────
    it('returns false for a one-time achievement when condition is not met', () => {
        const stats = { ...getDefaultStats(), totalMobsDefeated: 0 };
        expect(isAchievementUnlocked('first_steps', stats, makeSkills())).toBe(false);
    });

    it('returns true for a one-time achievement when condition is met', () => {
        const stats = { ...getDefaultStats(), totalMobsDefeated: 1 };
        expect(isAchievementUnlocked('first_steps', stats, makeSkills())).toBe(true);
    });

    it('handles skills-dependent one-time achievements (level_up)', () => {
        expect(isAchievementUnlocked('level_up', getDefaultStats(), makeSkills(1))).toBe(false);
        expect(isAchievementUnlocked('level_up', getDefaultStats(), makeSkills(2))).toBe(true);
    });
});

// ──────────────────────────────────────────────
// getCurrentTier
// ──────────────────────────────────────────────

describe('getCurrentTier', () => {
    it('returns -1 for an unknown achievement ID', () => {
        expect(getCurrentTier('unknown_id', getDefaultStats(), makeSkills())).toBe(-1);
    });

    it('returns -1 for a non-tiered achievement', () => {
        const stats = { ...getDefaultStats(), totalMobsDefeated: 5 };
        expect(getCurrentTier('first_steps', stats, makeSkills())).toBe(-1);
    });

    it('returns -1 when no tier has been reached yet', () => {
        const stats = { ...getDefaultStats(), phantomsCaught: 0 };
        expect(getCurrentTier('phantom_hunter', stats, makeSkills())).toBe(-1);
    });

    it('returns 0 when exactly at tier 1', () => {
        const stats = { ...getDefaultStats(), phantomsCaught: 5 };
        expect(getCurrentTier('phantom_hunter', stats, makeSkills())).toBe(0);
    });

    it('returns the correct index for an intermediate tier (Gold = index 2)', () => {
        const stats = { ...getDefaultStats(), phantomsCaught: 15 };
        expect(getCurrentTier('phantom_hunter', stats, makeSkills())).toBe(2);
    });

    it('returns the last index when at maximum tier', () => {
        const stats = { ...getDefaultStats(), phantomsCaught: 100 };
        expect(getCurrentTier('phantom_hunter', stats, makeSkills())).toBe(7);
    });

    it('returns the correct tier for combined_levels (skills-based)', () => {
        // 6 skills × 17 = 102 → tier 1 (Bronze Power, level 100)
        expect(getCurrentTier('combined_levels', getDefaultStats(), makeSkills(17))).toBe(0);
    });
});

// ──────────────────────────────────────────────
// getNextTier
// ──────────────────────────────────────────────

describe('getNextTier', () => {
    it('returns null for an unknown achievement ID', () => {
        expect(getNextTier('unknown_id', getDefaultStats(), makeSkills())).toBeNull();
    });

    it('returns null for a non-tiered achievement', () => {
        expect(getNextTier('first_steps', getDefaultStats(), makeSkills())).toBeNull();
    });

    it('returns null when already at the maximum tier', () => {
        const stats = { ...getDefaultStats(), phantomsCaught: 100 };
        expect(getNextTier('phantom_hunter', stats, makeSkills())).toBeNull();
    });

    it('returns the first tier when no tier has been reached yet', () => {
        const stats = { ...getDefaultStats(), phantomsCaught: 0 };
        expect(getNextTier('phantom_hunter', stats, makeSkills())).toEqual({
            level: 5,
            tierName: 'Bronze Ghost Buster',
        });
    });

    it('returns the correct next tier from an intermediate tier', () => {
        const stats = { ...getDefaultStats(), phantomsCaught: 5 }; // currently Bronze (index 0)
        expect(getNextTier('phantom_hunter', stats, makeSkills())).toEqual({
            level: 10,
            tierName: 'Silver Ghost Buster',
        });
    });
});

// ──────────────────────────────────────────────
// getTierProgress
// ──────────────────────────────────────────────

describe('getTierProgress', () => {
    it('returns 0 for an unknown achievement ID', () => {
        expect(getTierProgress('unknown_id', getDefaultStats(), makeSkills())).toBe(0);
    });

    it('returns 0 for a non-tiered achievement', () => {
        expect(getTierProgress('first_steps', getDefaultStats(), makeSkills())).toBe(0);
    });

    it('returns 100 when at the maximum tier', () => {
        const stats = { ...getDefaultStats(), phantomsCaught: 100 };
        expect(getTierProgress('phantom_hunter', stats, makeSkills())).toBe(100);
    });

    it('returns 100 when progress exceeds the maximum tier level', () => {
        const stats = { ...getDefaultStats(), phantomsCaught: 150 };
        expect(getTierProgress('phantom_hunter', stats, makeSkills())).toBe(100);
    });

    it('calculates the correct percentage before the first tier (3/5 → 60%)', () => {
        // 0 progress base, next tier at 5 → 3/5 = 60%
        const stats = { ...getDefaultStats(), phantomsCaught: 3 };
        expect(getTierProgress('phantom_hunter', stats, makeSkills())).toBe(60);
    });

    it('calculates the correct percentage between two tiers (7, Bronze→Silver: 2/5 → 40%)', () => {
        // Bronze at 5, Silver at 10 → (7-5)/(10-5) = 2/5 = 40%
        const stats = { ...getDefaultStats(), phantomsCaught: 7 };
        expect(getTierProgress('phantom_hunter', stats, makeSkills())).toBe(40);
    });
});

// ──────────────────────────────────────────────
// getNewlyUnlockedAchievements
// ──────────────────────────────────────────────

describe('getNewlyUnlockedAchievements', () => {
    it('returns an empty array when nothing changed', () => {
        const stats = getDefaultStats();
        const skills = makeSkills();
        expect(getNewlyUnlockedAchievements(stats, stats, skills, skills)).toEqual([]);
    });

    it('includes an achievement that just became unlocked via stats', () => {
        const oldStats = { ...getDefaultStats(), totalMobsDefeated: 0 };
        const newStats = { ...getDefaultStats(), totalMobsDefeated: 1 };
        const skills = makeSkills();
        const result = getNewlyUnlockedAchievements(oldStats, newStats, skills, skills);
        expect(result).toContain('first_steps');
    });

    it('does not include an achievement that was already unlocked', () => {
        const oldStats = { ...getDefaultStats(), totalMobsDefeated: 1 };
        const newStats = { ...getDefaultStats(), totalMobsDefeated: 2 };
        const skills = makeSkills();
        const result = getNewlyUnlockedAchievements(oldStats, newStats, skills, skills);
        expect(result).not.toContain('first_steps');
    });

    it('detects multiple newly unlocked achievements simultaneously', () => {
        const oldStats = { ...getDefaultStats(), totalMobsDefeated: 0, totalDeaths: 0 };
        const newStats = { ...getDefaultStats(), totalMobsDefeated: 1, totalDeaths: 1 };
        const skills = makeSkills();
        const result = getNewlyUnlockedAchievements(oldStats, newStats, skills, skills);
        expect(result).toContain('first_steps');
        expect(result).toContain('ouch');
    });

    it('detects unlock caused by a skill change (level_up)', () => {
        const stats = getDefaultStats();
        const result = getNewlyUnlockedAchievements(stats, stats, makeSkills(1), makeSkills(2));
        expect(result).toContain('level_up');
    });
});

// ──────────────────────────────────────────────
// getNewTierAchievements
// ──────────────────────────────────────────────

describe('getNewTierAchievements', () => {
    it('returns an empty array when nothing changed', () => {
        const stats = getDefaultStats();
        const skills = makeSkills();
        expect(getNewTierAchievements(stats, stats, skills, skills)).toEqual([]);
    });

    it('includes a tiered achievement that advanced to a new tier', () => {
        const oldStats = { ...getDefaultStats(), phantomsCaught: 0 };
        const newStats = { ...getDefaultStats(), phantomsCaught: 5 };
        const skills = makeSkills();
        const result = getNewTierAchievements(oldStats, newStats, skills, skills);
        expect(result).toContainEqual({ achievementId: 'phantom_hunter', tierIndex: 0 });
    });

    it('does not include a tiered achievement when the tier did not change', () => {
        // Already at Bronze (5), still at Bronze (7)
        const oldStats = { ...getDefaultStats(), phantomsCaught: 5 };
        const newStats = { ...getDefaultStats(), phantomsCaught: 7 };
        const skills = makeSkills();
        const result = getNewTierAchievements(oldStats, newStats, skills, skills);
        expect(result.map(r => r.achievementId)).not.toContain('phantom_hunter');
    });

    it('skips non-tiered achievements entirely', () => {
        const oldStats = { ...getDefaultStats(), totalMobsDefeated: 0 };
        const newStats = { ...getDefaultStats(), totalMobsDefeated: 1 };
        const skills = makeSkills();
        const result = getNewTierAchievements(oldStats, newStats, skills, skills);
        expect(result.map(r => r.achievementId)).not.toContain('first_steps');
    });

    it('detects tier advancement for skills-based achievements (combined_levels)', () => {
        const stats = getDefaultStats();
        // 6 × 1 = 6 (no tier) → 6 × 17 = 102 (Bronze Power, tier index 0)
        const result = getNewTierAchievements(stats, stats, makeSkills(1), makeSkills(17));
        expect(result).toContainEqual({ achievementId: 'combined_levels', tierIndex: 0 });
    });
});

// ──────────────────────────────────────────────
// addUniqueToArray
// ──────────────────────────────────────────────

describe('addUniqueToArray', () => {
    it('adds the value when it is not already present', () => {
        expect(addUniqueToArray(['a', 'b'], 'c')).toEqual(['a', 'b', 'c']);
    });

    it('returns a new array (does not mutate the original)', () => {
        const arr = ['a'];
        const result = addUniqueToArray(arr, 'b');
        expect(result).not.toBe(arr);
    });

    it('does not add a duplicate value', () => {
        expect(addUniqueToArray(['a', 'b', 'c'], 'b')).toEqual(['a', 'b', 'c']);
    });

    it('returns the same reference when the value already exists', () => {
        const arr = ['a', 'b'];
        expect(addUniqueToArray(arr, 'a')).toBe(arr);
    });

    it('works correctly on an empty array', () => {
        expect(addUniqueToArray([], 'x')).toEqual(['x']);
    });
});

// ──────────────────────────────────────────────
// recordLoginDate
// ──────────────────────────────────────────────

describe('recordLoginDate', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-09T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('adds today when it has not been recorded yet', () => {
        const result = recordLoginDate([]);
        expect(result).toContain('2026-03-09');
    });

    it('appends today to an existing list of other dates', () => {
        const result = recordLoginDate(['2026-03-07', '2026-03-08']);
        expect(result).toEqual(['2026-03-07', '2026-03-08', '2026-03-09']);
    });

    it('returns a new array reference when adding today', () => {
        const arr = ['2026-03-08'];
        const result = recordLoginDate(arr);
        expect(result).not.toBe(arr);
    });

    it('does not add today if it is already in the list', () => {
        const result = recordLoginDate(['2026-03-09']);
        expect(result).toEqual(['2026-03-09']);
    });

    it('returns the same array reference when today is already recorded', () => {
        const arr = ['2026-03-09'];
        expect(recordLoginDate(arr)).toBe(arr);
    });
});

// ──────────────────────────────────────────────
// getAchievementDisplayName
// ──────────────────────────────────────────────

describe('getAchievementDisplayName', () => {
    it('returns an empty string for an unknown achievement ID', () => {
        expect(getAchievementDisplayName('unknown_id', getDefaultStats(), makeSkills())).toBe('');
    });

    it('returns the achievement base name for a one-time achievement', () => {
        expect(getAchievementDisplayName('first_steps', getDefaultStats(), makeSkills())).toBe('First Steps');
    });

    it('returns the achievement base name for a tiered achievement when no tier is reached', () => {
        const stats = { ...getDefaultStats(), phantomsCaught: 0 };
        expect(getAchievementDisplayName('phantom_hunter', stats, makeSkills())).toBe('Ghost Buster');
    });

    it('returns the tier name when the first tier is reached', () => {
        const stats = { ...getDefaultStats(), phantomsCaught: 5 };
        expect(getAchievementDisplayName('phantom_hunter', stats, makeSkills())).toBe('Bronze Ghost Buster');
    });

    it('returns the correct tier name for a higher tier', () => {
        const stats = { ...getDefaultStats(), phantomsCaught: 50 };
        expect(getAchievementDisplayName('phantom_hunter', stats, makeSkills())).toBe('Diamond Ghost Buster');
    });

    it('returns the Mythic tier name when at maximum tier', () => {
        const stats = { ...getDefaultStats(), phantomsCaught: 100 };
        expect(getAchievementDisplayName('phantom_hunter', stats, makeSkills())).toBe('Mythic Ghost Buster');
    });
});
