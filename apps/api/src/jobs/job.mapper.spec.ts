import { describe, expect, it } from 'vitest';
import { excerpt } from './job.mapper.js';

/**
 * Feed excerpt derived from the full description.
 */
describe('excerpt', () => {
  it('returns null without a description', () => {
    expect(excerpt(null)).toBeNull();
  });

  it('flattens whitespace and keeps short texts whole', () => {
    expect(excerpt('Ligne 1\n\n  Ligne 2')).toBe('Ligne 1 Ligne 2');
  });

  it('cuts long texts on a word boundary', () => {
    const result = excerpt('mot '.repeat(100))!;
    expect(result.length).toBeLessThanOrEqual(221);
    expect(result.endsWith('mot…')).toBe(true);
  });
});
