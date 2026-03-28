// utils/phoneticUtils.js

const LETTER_PHONETICS = {
  a: ['a', 'ay', 'ei'],
  b: ['b', 'bee', 'be'],
  c: ['c', 'see', 'sea'],
  d: ['d', 'dee'],
  e: ['e', 'ee'],
  f: ['f', 'ef'],
  g: ['g', 'gee'],
  h: ['h', 'aitch'],
  i: ['i', 'eye'],
  j: ['j', 'jay'],
  k: ['k', 'kay'],
  l: ['l', 'el'],
  m: ['m', 'em'],
  n: ['n', 'en'],
  o: ['o', 'oh'],
  p: ['p', 'pee'],
  q: ['q', 'cue'],
  r: ['r', 'ar'],
  s: ['s', 'ess'],
  t: ['t', 'tee'],
  u: ['u', 'you'],
  v: ['v', 'vee'],
  w: ['w', 'doubleyou'],
  x: ['x', 'ex'],
  y: ['y', 'why'],
  z: ['z', 'zee', 'zed']
};

// reverse map → phonetic → canonical
const PHONETIC_TO_LETTER = Object.entries(LETTER_PHONETICS)
  .reduce((acc, [letter, variants]) => {
    variants.forEach(v => {
      acc[v] = letter;
    });
    return acc;
  }, {});

// -----------------------------
// normalize single word
// -----------------------------
export const normalizePhoneticWord = (word) => {
  if (!word) return '';

  const clean = word
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .trim();

  // direct match
  if (PHONETIC_TO_LETTER[clean]) {
    return PHONETIC_TO_LETTER[clean];
  }

  return clean;
};

// -----------------------------
// normalize sentence (take last word)
// -----------------------------
export const normalizeSpeech = (text) => {
  if (!text) return '';

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(' ')
    .filter(Boolean);

  const lastWord = words[words.length - 1];

  return normalizePhoneticWord(lastWord);
};