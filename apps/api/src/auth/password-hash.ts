import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { KEY_LENGTH, SALT_LENGTH, SCRYPT_OPTIONS } from './secret.constants.js';

/**
 * Hashes a password for storage: "scrypt$<salt hex>$<key hex>".
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const key = scryptSync(password, salt, KEY_LENGTH, SCRYPT_OPTIONS);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

/**
 * Checks a candidate against a stored hash in constant time on the key bytes.
 */
export function verifyPassword(candidate: unknown, stored: string): boolean {
  if (typeof candidate !== 'string') return false;
  const [scheme, saltHex, keyHex] = stored.split('$');
  if (scheme !== 'scrypt' || !saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, 'hex');
  const key = scryptSync(candidate, Buffer.from(saltHex, 'hex'), expected.length, SCRYPT_OPTIONS);
  return timingSafeEqual(key, expected);
}
