import { describe, it, expect, vi } from 'vitest';
import {
  ensureBasicSkillFields,
  ensureSkillMobs,
  ensureSkillAuras,
  ensureEncounterMobs,
  buildMobDefeatStats,
  buildLevelProgression,
  buildMobRotation,
  getCardStyle,
} from '@/utils/skillStateUtils';

/* ---------------- MOCKS ---------------- */

vi.mock('@/utils/gameUtils', () => ({
  getRandomMob: () => 'mob',
  getRandomFriendlyMob: () => 'friendly',
  getRandomMiniboss: () => 'mini',
  getRandomBoss: () => 'boss',
  getEncounterType: () => 'normal',
  calculateMobHealth: () => 100,
  calculateXPToLevel: () => 10,
}));

vi.mock('@/utils/mobDisplayUtils', () => ({
  getRandomAura: () => 'aura',
}));

vi.mock('@/constants/gameData', () => ({
  BASE_ASSETS: {
    badges: { Wood: 'wood.png' },
  },
}));

vi.mock('@/utils/achievementUtils', () => ({
  addUniqueToArray: (arr, value) => [...new Set([...arr, value])],
}));

/* ---------------- TESTS ---------------- */

describe('skillStateUtils', () => {

  /* -------- ensureBasicSkillFields -------- */

  it('fills missing fields', () => {
    const skill = {};
    const result = ensureBasicSkillFields(skill);

    expect(result.difficulty).toBe(1);
    expect(result.mobHealth).toBe(100);
    expect(result.lostLevel).toBe(false);
  });

  /* -------- ensureSkillMobs -------- */

  it('adds reading mob', () => {
    const skill = {};
    ensureSkillMobs(skill, 'reading');
    expect(skill.readingMob).toBeDefined();
  });

  it('adds memory mob', () => {
    const skill = {};
    ensureSkillMobs(skill, 'memory');
    expect(skill.memoryMob).toBeDefined();
  });

  /* -------- ensureSkillAuras -------- */

  it('adds aura for math', () => {
    const skill = {};
    ensureSkillAuras(skill, 'math');
    expect(skill.mathMobAura).toBeDefined();
  });

  /* -------- ensureEncounterMobs -------- */

  it('adds boss and miniboss', () => {
    const skill = {};
    ensureEncounterMobs(skill, 'math');

    expect(skill.currentBoss).toBeDefined();
    expect(skill.currentMiniboss).toBeDefined();
  });

  it('skips for memory', () => {
    const skill = {};
    const result = ensureEncounterMobs(skill, 'memory');

    expect(result.currentBoss).toBeUndefined();
  });

  /* -------- buildMobDefeatStats -------- */

  it('handles normal mob', () => {
    const result = buildMobDefeatStats({}, 'normal', {
      currentMob: 'zombie',
    });

    expect(result.totalMobsDefeated).toBe(1);
    expect(result.uniqueMobsDefeated).toContain('zombie');
  });

  it('handles miniboss', () => {
    const result = buildMobDefeatStats({}, 'miniboss', {
      currentMiniboss: 'mini',
    });

    expect(result.totalMinibossesDefeated).toBe(1);
  });

  it('handles boss', () => {
    const result = buildMobDefeatStats({}, 'boss', {
      currentBoss: 'boss',
    });

    expect(result.totalBossesDefeated).toBe(1);
  });

  /* -------- buildLevelProgression -------- */

  it('levels up correctly', () => {
    const result = buildLevelProgression(
      1,
      100,
      1,
      [],
      { id: 'math', fantasyName: 'Math' }
    );

    expect(result.didLevelUp).toBe(true);
  });

  it('does not level up if insufficient xp', () => {
    const result = buildLevelProgression(
      1,
      1,
      1,
      [],
      { id: 'math', fantasyName: 'Math' }
    );

    expect(result.didLevelUp).toBe(false);
  });

  /* -------- buildMobRotation -------- */

  it('returns rotation for reading', () => {
    const result = buildMobRotation('reading', {
      level: 1,
      readingMob: 'old',
    });

    expect(result.readingMob).toBeDefined();
    expect(result.readingMobAura).toBeDefined();
  });

  it('handles memory skill', () => {
    const result = buildMobRotation('memory', {
      level: 1,
    });

    expect(result.memoryMob).toBeDefined();
  });

  /* -------- getCardStyle -------- */

  it('returns style for active card', () => {
    const result = getCardStyle(0, false, false);

    expect(result.opacity).toBe(1);
  });

  it('returns style for offset card', () => {
    const result = getCardStyle(2, false, false);

    expect(result.opacity).toBeLessThan(1);
  });

});