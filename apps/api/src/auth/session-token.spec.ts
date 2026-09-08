import { describe, expect, it } from 'vitest';
import { generateToken, hashToken } from './session-token.js';

/**
 * Behaviour of the opaque session token.
 */
describe('session tokens', () => {
  it('are random and hashed deterministically', () => {
    const token = generateToken();
    expect(token).toHaveLength(64);
    expect(token).not.toBe(generateToken());
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toBe(token);
  });
});
