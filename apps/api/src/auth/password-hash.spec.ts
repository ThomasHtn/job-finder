import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password-hash.js';

/**
 * Behaviour of the stored password hash.
 */
describe('password hashing', () => {
  it('accepts the exact password and nothing else', () => {
    const stored = hashPassword('s3cret-long');
    expect(verifyPassword('s3cret-long', stored)).toBe(true);
    expect(verifyPassword('s3cret-lon', stored)).toBe(false);
    expect(verifyPassword('s3cret-long!', stored)).toBe(false);
    expect(verifyPassword('', stored)).toBe(false);
  });

  it('salts: the same password gives different hashes', () => {
    expect(hashPassword('s3cret-long')).not.toBe(hashPassword('s3cret-long'));
  });

  it('rejects anything that is not a string or a malformed hash', () => {
    const stored = hashPassword('s3cret-long');
    expect(verifyPassword(undefined, stored)).toBe(false);
    expect(verifyPassword(['s3cret-long'], stored)).toBe(false);
    expect(verifyPassword('s3cret-long', 'plain')).toBe(false);
  });
});
