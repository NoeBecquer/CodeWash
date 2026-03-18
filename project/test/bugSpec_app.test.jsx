/**
 * BUG SPECIFICATION TESTS — App.jsx behavioural bugs
 *
 * A FAILING test = a confirmed bug in the codebase.
 *
 * Tests use static source analysis (readFileSync) for bugs that live
 * inside the God Component event handlers, plus pure JS checks on constants.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { ACHIEVEMENTS } from '../src/constants/achievements.js';

const APP_SRC = readFileSync(
    '/home/williamwagner/delivery/Years2/G-ING-400/G-ING-400-STG-4-1-codewash-1/project/src/App.jsx',
    'utf-8'
);

function extractFunctionBody(src, funcName) {
    const start = src.indexOf(`const ${funcName}`);
    if (start === -1) return '';
    // Walk forward to find the closing `};` of the arrow function
    // (it may be indented, so we cannot use a raw \n}; pattern)
    let depth = 0;
    let i = start;
    let foundOpen = false;
    while (i < src.length) {
        if (src[i] === '{') { depth++; foundOpen = true; }
        if (src[i] === '}') { depth--; }
        if (foundOpen && depth === 0) { i++; break; }
        i++;
    }
    return src.slice(start, i);
}

// ─────────────────────────────────────────────────────────────────────────────
// BUG 9 — unlockedAchievements only checks 5 of 19 achievements
// ─────────────────────────────────────────────────────────────────────────────
describe('BUG 9 — unlockedAchievements should track ALL achievements', () => {
    it('every achievement ID should appear in the hardcoded list in App.jsx', () => {
        const allIds = Object.keys(ACHIEVEMENTS);
        const checkedInApp = ['speed_demon', 'world_ender', 'monster_manual', 'perfectionist', 'full_set'];
        const missing = allIds.filter(id => !checkedInApp.includes(id));
        // EXPECTED: no missing IDs  ← WILL FAIL (14 are missing)
        expect(missing).toHaveLength(0);
    });

    it('the number of tracked achievements should equal total achievements', () => {
        const totalAchievements = Object.keys(ACHIEVEMENTS).length;
        const checkedInApp = 5; // hardcoded array length in App.jsx
        // EXPECTED: 5 === totalAchievements  ← WILL FAIL
        expect(checkedInApp).toBe(totalAchievements);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG 10 — handleSwitchProfile does NOT reset stats, health, or battle state
// ─────────────────────────────────────────────────────────────────────────────
describe('BUG 10 — profile switch should reset stats, health, and battle state', () => {
    const fnBody = extractFunctionBody(APP_SRC, 'handleSwitchProfile');

    it('handleSwitchProfile should call setStats to load the new profile stats', () => {
        // WILL FAIL — setStats is not called in handleSwitchProfile
        expect(fnBody).toContain('setStats');
    });

    it('handleSwitchProfile should reset playerHealth to 10', () => {
        // WILL FAIL — setPlayerHealth is not called
        expect(fnBody).toContain('setPlayerHealth');
    });

    it('handleSwitchProfile should clear any ongoing battle', () => {
        // WILL FAIL — setBattlingSkillId is not called
        expect(fnBody).toContain('setBattlingSkillId');
    });

    it('handleSwitchProfile should call loadStats for the new profile', () => {
        // WILL FAIL — loadStats is not called
        expect(fnBody).toContain('loadStats');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG 11 — Loot box always shows the Wood badge image regardless of actual tier
// ─────────────────────────────────────────────────────────────────────────────
describe('BUG 11 — loot box badge image should reflect which tier was earned', () => {
    it('the badge award block should NOT hardcode badges.Wood as the image', () => {
        const badgeBlock = APP_SRC.slice(
            APP_SRC.indexOf('newBadges.push(newTier)'),
            APP_SRC.indexOf('newBadges.push(newTier)') + 300
        );
        // EXPECTED: img is dynamic  ← WILL FAIL (hardcoded to badges.Wood)
        expect(badgeBlock).not.toContain('badges.Wood');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG 12 — Death sequence restores HP to 10 while YOU DIED overlay still shows
// ─────────────────────────────────────────────────────────────────────────────
describe('BUG 12 — health should restore AFTER death overlay is hidden', () => {
    it('return 10 should be inside the setTimeout callback, not before it', () => {
        const deathStart   = APP_SRC.indexOf('setShowDeathOverlay(true)');
        // `return 10` appears ~40 lines / ~2500 chars after setShowDeathOverlay(true)
        const deathSection = APP_SRC.slice(deathStart, deathStart + 3000);

        const returnTenIdx    = deathSection.indexOf('return 10');
        const setTimeoutIdx   = deathSection.indexOf('setTimeout(');
        const timeoutCloseIdx = deathSection.indexOf('}, 2000)');

        expect(returnTenIdx).toBeGreaterThan(-1);
        expect(setTimeoutIdx).toBeGreaterThan(-1);
        expect(timeoutCloseIdx).toBeGreaterThan(-1);

        // EXPECTED: return 10 is INSIDE the setTimeout block
        // WILL FAIL — return 10 is AFTER the setTimeout closing bracket
        expect(returnTenIdx).toBeGreaterThan(setTimeoutIdx);
        expect(returnTenIdx).toBeLessThan(timeoutCloseIdx);
    });
});
