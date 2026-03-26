import { describe, test, expect } from 'vitest';
import { generateChallenge } from '@/utils/challengeUtils';

describe('generateChallenge', () => {
  test('returns memory challenge', async () => {
    const result = await generateChallenge('memory', 1);

    expect(result.type).toBe('memory');
    expect(result.answer).toBe('WIN');
  });

  test('returns patterns challenge', async () => {
    const result = await generateChallenge('patterns', 1);

    expect(result.type).toBe('patterns');
    expect(result.answer).toBe('WIN');
  });

  test('returns fallback challenge', async () => {
    const result = await generateChallenge('unknown', 1);

    expect(result.type).toBe('manual');
  });
});