import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * scrypt parameters: N=2^15, r=8, p=1 (~50 ms, ~32 MiB), 64-byte key.
 */
const SCRYPT_OPTIONS = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const KEY_LENGTH = 64;

/**
 * Hashes a password for storage: "scrypt$<salt hex>$<key hex>".
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
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

/**
 * Opaque session token handed to the browser: 256 bits of randomness.
 */
export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Tokens are stored hashed so a database leak does not yield usable sessions.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
