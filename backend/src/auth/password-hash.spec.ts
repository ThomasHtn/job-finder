import { describe, expect, it } from 'vitest';

import { hashPassword, verifyPassword } from './password-hash.js';

/**
 * Behaviour of the stored password hash.
 */
describe('password hashing', () => {
  it('accepts the exact password and nothing else', async () => {
    const stored = await hashPassword('s3cret-long');
    expect(await verifyPassword('s3cret-long', stored)).toBe(true);
    expect(await verifyPassword('s3cret-lon', stored)).toBe(false);
    expect(await verifyPassword('s3cret-long!', stored)).toBe(false);
    expect(await verifyPassword('', stored)).toBe(false);
  });

  it('salts: the same password gives different hashes', async () => {
    expect(await hashPassword('s3cret-long')).not.toBe(await hashPassword('s3cret-long'));
  });

  it('rejects anything that is not a string or a malformed hash', async () => {
    const stored = await hashPassword('s3cret-long');
    expect(await verifyPassword(undefined, stored)).toBe(false);
    expect(await verifyPassword(['s3cret-long'], stored)).toBe(false);
    expect(await verifyPassword('s3cret-long', 'plain')).toBe(false);
  });

  it('rejects any password against a hash whose key is not valid hex', async () => {
    expect(await verifyPassword('anything', 'scrypt$aa$zz')).toBe(false);
    expect(await verifyPassword('anything', 'scrypt$aa$abcd')).toBe(false);
  });
});
