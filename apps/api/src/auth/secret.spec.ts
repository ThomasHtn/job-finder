import { describe, expect, it } from 'vitest';
import { secretsMatch } from './secret.js';

/**
 * Behaviour of the constant-time secret comparison.
 */
describe('secretsMatch', () => {
  it('accepts the exact value', () => {
    expect(secretsMatch('s3cret', 's3cret')).toBe(true);
  });

  it('rejects a different value, whatever its length', () => {
    expect(secretsMatch('s3cre', 's3cret')).toBe(false);
    expect(secretsMatch('s3cret!', 's3cret')).toBe(false);
    expect(secretsMatch('', 's3cret')).toBe(false);
  });

  it('rejects anything that is not a string', () => {
    expect(secretsMatch(undefined, 's3cret')).toBe(false);
    expect(secretsMatch(['s3cret'], 's3cret')).toBe(false);
    expect(secretsMatch({ toString: () => 's3cret' }, 's3cret')).toBe(false);
  });
});
