import {
  HOSTILE_MOBS,
  FRIENDLY_MOBS,
  CHEST_BLOCKS,
  SPECIAL_CHESTS,
  MINIBOSS_MOBS,
  BOSS_MOBS,
  DIFFICULTY_CONTENT
} from '../constants/gameData';

// ============================================================
// 🔧 INTERNAL HELPERS
// ============================================================

const gameContentCache = new Map();

const pickRandom = (arr, fallback) => {
  if (!arr || arr.length === 0) return fallback;
  return arr[Math.floor(Math.random() * arr.length)];
};

const safeArray = (arr) => (Array.isArray(arr) ? arr : []);

// ============================================================
// 🌍 CONTENT LOADER (CACHED)
// ============================================================

const loadGameContent = async (locale = 'en') => {
  if (gameContentCache.has(locale)) {
    return gameContentCache.get(locale);
  }

  try {
    const res = await fetch(`/locales/${locale}/gameContent.json`);
    const data = await res.json();
    gameContentCache.set(locale, data);
    return data;
  } catch {
    const res = await fetch(`/locales/en/gameContent.json`);
    const data = await res.json();
    gameContentCache.set('en', data);
    return data;
  }
};

// ============================================================
// 🧠 TEXT UTILS
// ============================================================

export const normalizeText = (s = '') =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

// ============================================================
// 🎲 RANDOM MOBS
// ============================================================

export const getRandomMob = (exclude) => {
  const pool = Object.keys(HOSTILE_MOBS).filter(m => m !== exclude);
  return pickRandom(pool, 'Zombie');
};

export const getRandomFriendlyMob = () =>
  pickRandom(Object.keys(FRIENDLY_MOBS), 'Allay');

export const getRandomMiniboss = () =>
  pickRandom(Object.keys(MINIBOSS_MOBS), 'Wither Skeleton');

export const getRandomBoss = () =>
  pickRandom(Object.keys(BOSS_MOBS), 'Wither');

// ============================================================
// ⚔️ ENCOUNTER SYSTEM
// ============================================================

export const getEncounterType = (level) => {
  const safeLevel = Math.max(1, level);
  const cycle = ((safeLevel - 1) % 20) + 1;

  if (cycle === 20) return 'boss';
  if (cycle === 10) return 'miniboss';
  return 'hostile';
};

// ============================================================
// 🎯 MOB SELECTION
// ============================================================

export const getMobForSkill = (skillConfig, userSkill = {}) => {
  const level = userSkill.level || 1;

  // ---------------- CLEANING ----------------
  if (skillConfig.id === 'cleaning') {
    if (level % 20 === 0) return 'Ender Chest';
    if (level % 5 === 0) return 'Shulker Box';

    const standard = Object.keys(CHEST_BLOCKS).filter(
      k => !SPECIAL_CHESTS.includes(k)
    );

    return standard[(level - 1) % standard.length];
  }

  // ---------------- MEMORY ----------------
  if (skillConfig.id === 'memory') {
    return userSkill.memoryMob || getRandomFriendlyMob();
  }

  // ---------------- ENCOUNTER ----------------
  const type = getEncounterType(level);

  if (type === 'boss') {
    return userSkill.currentBoss || getRandomBoss();
  }

  if (type === 'miniboss') {
    return userSkill.currentMiniboss || getRandomMiniboss();
  }

  // ---------------- COMBAT SKILLS ----------------
  const map = {
    reading: userSkill.readingMob,
    math: userSkill.mathMob,
    writing: userSkill.writingMob,
    patterns: userSkill.patternMob
  };

  if (skillConfig.id in map) {
    return map[skillConfig.id] || getRandomMob();
  }

  // ---------------- FALLBACK ----------------
  const hostileKeys = Object.keys(HOSTILE_MOBS);
  return hostileKeys.includes(userSkill.currentMob)
    ? userSkill.currentMob
    : pickRandom(hostileKeys, 'Zombie');
};

// ============================================================
// 📈 PROGRESSION SYSTEM
// ============================================================

const LEVEL_SCALING_FACTOR = 1.035;
const DIFFICULTY_PENALTY_FACTOR = 0.3;

const BASE_DAMAGE = 12;
const BASE_MOB_HEALTH = 60;
const BASE_XP_REWARD = 100;
const BASE_XP_TO_LEVEL = 100;

export const getDifficultyMultiplier = (difficulty) =>
  Math.pow(3, difficulty - 1);

export const calculateDamage = (_, difficulty) =>
  BASE_DAMAGE * getDifficultyMultiplier(difficulty);

export const calculateMobHealth = (difficulty) =>
  BASE_MOB_HEALTH * getDifficultyMultiplier(difficulty);

export const getExpectedDifficulty = (level) =>
  Math.min(7, Math.floor((level - 1) / 20) + 1);

export const calculateXPReward = (difficulty, level) => {
  const multiplier = getDifficultyMultiplier(difficulty);

  if (level === undefined) {
    return BASE_XP_REWARD * multiplier;
  }

  const expected = getExpectedDifficulty(level);
  const base = BASE_XP_REWARD * Math.pow(LEVEL_SCALING_FACTOR, level - 1);
  const full = Math.floor(base * multiplier);

  if (difficulty >= expected) return full;

  const gap = expected - difficulty;
  const penalty = Math.pow(DIFFICULTY_PENALTY_FACTOR, gap);

  return Math.floor(full * penalty);
};

export const calculateXPToLevel = (difficulty, level) => {
  const multiplier = getDifficultyMultiplier(difficulty);

  if (level === undefined) {
    return BASE_XP_TO_LEVEL * multiplier;
  }

  const base = BASE_XP_TO_LEVEL * Math.pow(LEVEL_SCALING_FACTOR, level - 1);

  return Math.floor(base * multiplier);
};

// ============================================================
// 📖 READING
// ============================================================

export const getReadingWord = async (difficulty, locale = 'en') => {
  const content = await loadGameContent(locale);

  if (difficulty === 7 && content.funnyLongWords?.length) {
    return pickRandom(content.funnyLongWords, 'HELLO');
  }

  const config =
    DIFFICULTY_CONTENT.reading[difficulty] ||
    DIFFICULTY_CONTENT.reading[1];

  const length = String(config?.charLength || 3);

  const words =
    content.readingWords?.[length] ||
    content.readingWords?.['3'] ||
    ['cat'];

  return pickRandom(words, 'cat');
};

// ============================================================
// ➕ MATH
// ============================================================

export const generateMathProblem = (difficulty) => {
  const config =
    DIFFICULTY_CONTENT.math[difficulty] ||
    DIFFICULTY_CONTENT.math[1];

  const operations = config.operations || ['+'];
  const [min, max] = config.range || [1, 9];

  const op = pickRandom(operations, '+');

  let a, b;

  switch (op) {
    case '+':
      a = rand(min, max);
      b = rand(min, max);
      return { type: 'math', question: `${a} + ${b} = ?`, answer: `${a + b}` };

    case '-': {
      const x = rand(min, max);
      const y = rand(min, max);
      const big = Math.max(x, y);
      const small = Math.min(x, y);
      return { type: 'math', question: `${big} - ${small} = ?`, answer: `${big - small}` };
    }

    case '*':
      a = rand(min, max);
      b = rand(min, max);
      return { type: 'math', question: `${a} × ${b} = ?`, answer: `${a * b}` };

    case '/': {
      b = rand(1, 10);
      const q = rand(1, 10);
      a = b * q;
      return { type: 'math', question: `${a} ÷ ${b} = ?`, answer: `${q}` };
    }

    default:
      return { type: 'math', question: `1 + 1 = ?`, answer: '2' };
  }
};

const rand = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// ============================================================
// ✍️ WRITING
// ============================================================

const buildWritingPools = (index = []) => ({
  1: index.filter(w => w.length >= 3 && w.length <= 5),
  2: index.filter(w => w.length >= 5 && w.length <= 7),
  3: index.filter(w => w.length >= 6 && w.length <= 8),
  4: index.filter(w => w.length >= 7 && w.length <= 10),
  5: index.filter(w => w.length >= 9),
  6: index.filter(w => w.length >= 8),   // ← overlap ensures non-empty
  7: index.filter(w => w.length >= 6),   // ← guaranteed non-empty
});

export const getWordForDifficulty = async (difficulty, locale = 'en') => {
  const content = await loadGameContent(locale);

  const pools = buildWritingPools(content.writingWordIndex || []);

  const rawPool = pools[difficulty];
  const pool = rawPool && rawPool.length > 0 ? rawPool : pools[5];

  const item = pickRandom(pool, pickRandom(pools[1], null));

  if (!item) {
    return { word: 'ERROR', displayName: 'Error', image: '' };
  }

  return {
    word: item.word.toUpperCase(),
    displayName: item.displayName,
    image: item.imagePath
  };
};