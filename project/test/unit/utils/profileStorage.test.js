import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getStorageKey,
  loadSkills,
  loadTheme,
  loadStats,
  readStoredProfileStats,
} from '@/utils/profileStorage';

/* ---------------- MOCKS ---------------- */

vi.mock('@/utils/gameUtils', () => ({
  getRandomMob: () => 'mob',
  getRandomFriendlyMob: () => 'friendly',
  getRandomMiniboss: () => 'mini',
  getRandomBoss: () => 'boss',
  calculateMobHealth: () => 100,
}));

vi.mock('@/utils/mobDisplayUtils', () => ({
  getRandomAura: () => 'aura',
}));

vi.mock('@/constants/gameData', () => ({
  SKILL_DATA: [
    { id: 'math' },
    { id: 'reading' },
  ],
}));

vi.mock('@/utils/achievementUtils', () => ({
  getDefaultStats: () => ({ totalXP: 0 }),
}));

vi.mock('@/utils/skillStateUtils', () => ({
  ensureBasicSkillFields: (s) => s,
  ensureSkillMobs: (s) => s,
  ensureSkillAuras: (s) => s,
  ensureEncounterMobs: (s) => s,
}));

/* ---------------- TESTS ---------------- */

describe('profileStorage', () => {

  beforeEach(() => {
    localStorage.clear();
  });

  /* ---------- getStorageKey ---------- */

  it('builds correct storage key', () => {
    expect(getStorageKey(2)).toBe('heroSkills_v23_p2');
  });

  /* ---------- loadSkills ---------- */

  it('returns default skills when no data exists', () => {
    const result = loadSkills(1);

    expect(result).toHaveProperty('math');
    expect(result.math.level).toBe(1);
  });

  it('loads and merges saved skills', () => {
    localStorage.setItem(
      'heroSkills_v23_p1',
      JSON.stringify({
        skills: {
          math: { level: 5 },
        },
      })
    );

    const result = loadSkills(1);

    expect(result.math.level).toBe(5);
  });

  it('handles invalid JSON gracefully', () => {
    localStorage.setItem('heroSkills_v23_p1', 'invalid');

    const result = loadSkills(1);

    expect(result).toHaveProperty('math');
  });

  /* ---------- loadTheme ---------- */

  it('returns stored theme', () => {
    localStorage.setItem(
      'heroSkills_v23_p1',
      JSON.stringify({ theme: 'dark' })
    );

    expect(loadTheme(1)).toBe('dark');
  });

  it('falls back to default theme', () => {
    expect(loadTheme(1)).toBe('minecraft');
  });

  /* ---------- loadStats ---------- */

  it('loads stats and merges defaults', () => {
    localStorage.setItem(
      'heroSkills_v23_p1',
      JSON.stringify({
        stats: { totalXP: 100 },
      })
    );

    const result = loadStats(1);

    expect(result.totalXP).toBe(100);
  });

  it('returns default stats on failure', () => {
    localStorage.setItem('heroSkills_v23_p1', 'invalid');

    const result = loadStats(1);

    expect(result.totalXP).toBe(0);
  });

  /* ---------- readStoredProfileStats ---------- */

  it('computes profile summary stats', () => {
    localStorage.setItem(
      'heroSkills_v23_p1',
      JSON.stringify({
        skills: {
          math: { level: 3 },
          reading: { level: 5 },
        },
        theme: 'dark',
      })
    );

    const result = readStoredProfileStats(1);

    expect(result.totalLevel).toBe(8);
    expect(result.highestLevel).toBe(5);
    expect(result.theme).toBe('dark');
  });

  it('returns null if no data exists', () => {
    expect(readStoredProfileStats(1)).toBeNull();
  });

});