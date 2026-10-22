import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

import { KEY_LENGTH, SALT_LENGTH, SCRYPT_OPTIONS } from './secret.constants.js';

/**
 * Async scrypt, so hashing never blocks the event loop of the API.
 */
const deriveKey = promisify<string, Buffer, number, typeof SCRYPT_OPTIONS, Buffer>(scrypt);

/**
 * Hashes a password for storage: "scrypt$<salt hex>$<key hex>".
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await deriveKey(password, salt, KEY_LENGTH, SCRYPT_OPTIONS);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

/**
 * Checks a candidate against a stored hash in constant time on the key bytes.
 */
export async function verifyPassword(candidate: unknown, stored: string): Promise<boolean> {
  if (typeof candidate !== 'string') return false;
  const [scheme, saltHex, keyHex] = stored.split('$');
  if (scheme !== 'scrypt' || !saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, 'hex');
  /* A malformed key decodes short, and two empty buffers would compare equal. */
  if (expected.length !== KEY_LENGTH) return false;
  const key = await deriveKey(
    candidate,
    Buffer.from(saltHex, 'hex'),
    expected.length,
    SCRYPT_OPTIONS,
  );
  return timingSafeEqual(key, expected);
}
