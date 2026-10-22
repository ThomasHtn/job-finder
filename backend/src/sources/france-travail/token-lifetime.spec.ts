import { describe, expect, it } from 'vitest';

import { TOKEN_DEFAULT_TTL_S } from './france-travail.constants.js';
import { tokenLifetimeSeconds } from './token-lifetime.js';

/**
 * Lifetime of an OAuth token, announced or assumed.
 */
describe('tokenLifetimeSeconds', () => {
  it('keeps the announced lifetime', () => {
    expect(tokenLifetimeSeconds({ access_token: 't', expires_in: 1499 })).toBe(1499);
  });

  it('falls back to the default when the lifetime is missing, not a number or too short', () => {
    expect(tokenLifetimeSeconds({ access_token: 't' })).toBe(TOKEN_DEFAULT_TTL_S);
    expect(tokenLifetimeSeconds({ access_token: 't', expires_in: Number.NaN })).toBe(
      TOKEN_DEFAULT_TTL_S,
    );
    expect(
      tokenLifetimeSeconds({ access_token: 't', expires_in: '900' as unknown as number }),
    ).toBe(TOKEN_DEFAULT_TTL_S);
    expect(tokenLifetimeSeconds({ access_token: 't', expires_in: 10 })).toBe(TOKEN_DEFAULT_TTL_S);
  });
});
