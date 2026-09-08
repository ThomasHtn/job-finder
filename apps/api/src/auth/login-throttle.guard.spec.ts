import { HttpException, type ExecutionContext } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { MAX_ATTEMPTS, WINDOW_MS } from './login-throttle.constants.js';
import { LoginThrottleGuard } from './login-throttle.guard.js';

/**
 * Builds a minimal execution context carrying the client address.
 */
function context(ip: string): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ ip }) }),
  } as unknown as ExecutionContext;
}

/**
 * Guard whose clock is driven by the test.
 */
function guardAt(clock: () => number): LoginThrottleGuard {
  const guard = new LoginThrottleGuard();
  Object.assign(guard, { now: clock });
  return guard;
}

/**
 * Behaviour of the login rate limiter with a controllable clock.
 */
describe('LoginThrottleGuard', () => {
  it('lets a client through until the quota is reached', () => {
    const guard = guardAt(() => 0);
    for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
      expect(guard.canActivate(context('1.1.1.1'))).toBe(true);
    }
    expect(() => guard.canActivate(context('1.1.1.1'))).toThrow(HttpException);
  });

  it('counts clients separately', () => {
    const guard = guardAt(() => 0);
    for (let i = 0; i < MAX_ATTEMPTS; i += 1) guard.canActivate(context('1.1.1.1'));
    expect(guard.canActivate(context('2.2.2.2'))).toBe(true);
  });

  it('forgets attempts once the window has slid', () => {
    let now = 0;
    const guard = guardAt(() => now);
    for (let i = 0; i < MAX_ATTEMPTS; i += 1) guard.canActivate(context('1.1.1.1'));
    now = WINDOW_MS + 1;
    expect(guard.canActivate(context('1.1.1.1'))).toBe(true);
  });
});
