import { describe, it, expect } from 'vitest';
import {
  normalizePhoneticWord,
  normalizeSpeech,
} from '@/utils/phoneticUtils';

describe('phoneticUtils', () => {

  /* ---------------- normalizePhoneticWord ---------------- */

  it('returns empty string for falsy input', () => {
    expect(normalizePhoneticWord('')).toBe('');
    expect(normalizePhoneticWord(null)).toBe('');
    expect(normalizePhoneticWord(undefined)).toBe('');
  });

  it('normalizes phonetic variant to letter', () => {
    expect(normalizePhoneticWord('bee')).toBe('b');
    expect(normalizePhoneticWord('zee')).toBe('z');
    expect(normalizePhoneticWord('doubleyou')).toBe('w');
  });

  it('handles uppercase and punctuation', () => {
    expect(normalizePhoneticWord('Bee!')).toBe('b');
    expect(normalizePhoneticWord('ZEE')).toBe('z');
  });

  it('returns cleaned word if no phonetic match', () => {
    expect(normalizePhoneticWord('hello')).toBe('hello');
  });

  /* ---------------- normalizeSpeech ---------------- */

  it('returns empty string for empty input', () => {
    expect(normalizeSpeech('')).toBe('');
    expect(normalizeSpeech(null)).toBe('');
  });

  it('returns normalized last word', () => {
    expect(normalizeSpeech('this is bee')).toBe('b');
    expect(normalizeSpeech('say zee')).toBe('z');
  });

  it('handles punctuation and spacing', () => {
    expect(normalizeSpeech('hello there, bee!')).toBe('b');
  });

  it('returns cleaned last word if no phonetic match', () => {
    expect(normalizeSpeech('hello world')).toBe('world');
  });

});