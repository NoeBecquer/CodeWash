// test/unit/utils/generateChallenge.test.js

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateChallenge } from '@/utils/challengeUtils';
import * as gameUtils from '@/utils/gameUtils';

/* -------------------------------------------------------------------------- */
/*                                   MOCKS                                    */
/* -------------------------------------------------------------------------- */

vi.mock('@/utils/gameUtils', () => ({
  generateMathProblem: vi.fn(),
  getReadingWord: vi.fn(),
  getWordForDifficulty: vi.fn(),
}));

/* -------------------------------------------------------------------------- */
/*                                   TESTS                                    */
/* -------------------------------------------------------------------------- */

describe('generateChallenge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* ----------------------------- math ----------------------------- */

  it('returns math problem', async () => {
    gameUtils.generateMathProblem.mockReturnValue({
      type: 'math',
      question: '1+1',
      answer: '2',
    });

    const result = await generateChallenge('math', 1);

    expect(gameUtils.generateMathProblem).toHaveBeenCalledWith(1);
    expect(result.answer).toBe('2');
  });

  /* ---------------------------- patterns --------------------------- */

  it('returns patterns challenge', async () => {
    const result = await generateChallenge('patterns', 1);

    expect(result).toEqual({
      type: 'patterns',
      question: 'Simon Says!',
      answer: 'WIN',
    });
  });

  /* ---------------------------- reading ---------------------------- */

  it('returns reading challenge', async () => {
    gameUtils.getReadingWord.mockResolvedValue('cat');

    const result = await generateChallenge('reading', 2);

    expect(result.type).toBe('reading');
    expect(result.question).toBe('cat');
    expect(result.answer).toBe('cat');
    expect(result.id).toBeDefined();
  });

  /* ---------------------------- writing ---------------------------- */

  it('returns writing challenge', async () => {
    gameUtils.getWordForDifficulty.mockResolvedValue({
      displayName: 'apple',
      image: 'apple.png',
    });

    const result = await generateChallenge('writing', 3);

    expect(result.type).toBe('writing');
    expect(result.answer).toBe('APPLE');
    expect(result.images).toEqual(['apple.png']);
    expect(result.displayName).toBe('apple');
  });

  /* ----------------------------- memory ---------------------------- */

  it('returns memory challenge', async () => {
    const result = await generateChallenge('memory', 1);

    expect(result.type).toBe('memory');
    expect(result.answer).toBe('WIN');
    expect(result.id).toBeDefined();
  });

  /* ---------------------------- cleaning --------------------------- */

  it('returns cleaning challenge', async () => {
    const result = await generateChallenge('cleaning', 1);

    expect(result.type).toBe('cleaning');
    expect(result.answer).toBe('WIN');
    expect(result.id).toBeDefined();
  });

  /* ---------------------------- default ---------------------------- */

  it('returns default challenge for unknown type', async () => {
    const result = await generateChallenge('unknown', 1);

    expect(result).toEqual({
      type: 'manual',
      question: 'Task Complete?',
      answer: 'yes',
    });
  });
});