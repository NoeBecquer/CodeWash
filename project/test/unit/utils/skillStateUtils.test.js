import { describe, it, expect } from 'vitest';
import {
  buildMobDefeatStats,
  buildLevelProgression,
  buildMobRotation,
} from '@/utils/skillStateUtils';

describe('skillStateUtils', () => {

  /* ---------------- buildMobDefeatStats ---------------- */

  it('increments normal mob stats', () => {
    const prev = {
      battlesThisSession: 0,
      totalMobsDefeated: 1,
      uniqueMobsDefeated: ['zombie'],
    };

    const current = { currentMob: 'zombie' };

    const result = buildMobDefeatStats(prev, 'normal', current);

    expect(result.totalMobsDefeated).toBe(2);
    expect(result.uniqueMobsDefeated).toContain('zombie');
    expect(result.battlesThisSession).toBe(1);
  });

  it('increments miniboss stats', () => {
    const prev = {};

    const current = { currentMiniboss: 'mini1' };

    const result = buildMobDefeatStats(prev, 'miniboss', current);

    expect(result.totalMinibossesDefeated).toBe(1);
    expect(result.uniqueMinibossesDefeated).toContain('mini1');
  });

  it('increments boss stats', () => {
    const prev = {};

    const current = { currentBoss: 'boss1' };

    const result = buildMobDefeatStats(prev, 'boss', current);

    expect(result.totalBossesDefeated).toBe(1);
    expect(result.uniqueBossesDefeated).toContain('boss1');
  });

  /* ---------------- buildLevelProgression ---------------- */

  it('levels up when xp exceeds threshold', () => {
    const result = buildLevelProgression(
      1,        // level
      500,      // xp
      1,        // difficulty
      [],       // badges
      { id: 'math', fantasyName: 'Math' }
    );

    expect(result.didLevelUp).toBe(true);
    expect(result.newLevel).toBeGreaterThan(1);
  });

  it('does not level up if xp is insufficient', () => {
    const result = buildLevelProgression(
      1,
      1,
      1,
      [],
      { id: 'math', fantasyName: 'Math' }
    );

    expect(result.didLevelUp).toBe(false);
    expect(result.newLevel).toBe(1);
  });

  /* ---------------- buildMobRotation ---------------- */

  it('returns rotation updates object', () => {
    const current = {
      level: 1,
      readingMob: 'mob1',
      currentMob: 'mob1',
    };

    const result = buildMobRotation('reading', current);

    expect(typeof result).toBe('object');
  });

  it('handles memory skill correctly', () => {
    const result = buildMobRotation('memory', { level: 1 });

    expect(result).toHaveProperty('memoryMob');
  });

});