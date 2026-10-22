import { TOKEN_DEFAULT_TTL_S, TOKEN_REFRESH_MARGIN_S } from './france-travail.constants.js';
import type { TokenResponse } from './france-travail.types.js';

/**
 * Seconds a token lives: the announced lifetime when it is a number longer than the refresh margin,
 * the default otherwise, so a bad answer never makes the token refetched on every page.
 */
export function tokenLifetimeSeconds(token: TokenResponse): number {
  const announced = token.expires_in;
  const isUsable =
    typeof announced === 'number' &&
    Number.isFinite(announced) &&
    announced > TOKEN_REFRESH_MARGIN_S;
  return isUsable ? announced : TOKEN_DEFAULT_TTL_S;
}
