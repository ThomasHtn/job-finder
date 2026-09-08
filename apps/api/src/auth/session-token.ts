import { createHash, randomBytes } from 'node:crypto';
import { TOKEN_LENGTH } from './secret.constants.js';

/**
 * Opaque session token handed to the browser.
 */
export function generateToken(): string {
  return randomBytes(TOKEN_LENGTH).toString('hex');
}

/**
 * Tokens are stored hashed so a database leak does not yield usable sessions.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
