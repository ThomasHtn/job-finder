import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Request } from 'express';

import type { Env } from '../shared/config/env.schema.js';
import { MAX_ATTEMPTS, WINDOW_MS } from './auth.constants.js';
import type { Attempts } from './login-throttle.types.js';

/**
 * In-memory brute-force protection for the login route: a client that made
 * MAX_ATTEMPTS attempts within WINDOW_MS is refused with 429 until the window
 * slides. Single-process by design, which matches the deployment (one api container).
 */
@Injectable()
export class LoginThrottleGuard implements CanActivate {
  /**
   * Recent attempts keyed by client address.
   */
  private readonly attempts = new Map<string, Attempts>();

  /**
   * False in development and the demo only (LOGIN_THROTTLE_ENABLED), so repeated sign-ins never lock you out.
   */
  private readonly enabled: boolean;

  /**
   * Clock, a property rather than a constructor parameter so Nest has nothing
   * to inject for it; tests replace it to move time forward.
   */
  protected now: () => number = Date.now;

  /**
   * Reads the switch once: it never changes while the process runs.
   */
  constructor(config: ConfigService<Env, true>) {
    this.enabled = config.get('LOGIN_THROTTLE_ENABLED', { infer: true });
  }

  /**
   * Records the attempt and rejects the request once the client is over quota.
   * Every call counts, successful or not: the login route is cheap to retry.
   */
  public canActivate(context: ExecutionContext): boolean {
    if (!this.enabled) return true;
    const request = context.switchToHttp().getRequest<Request>();
    const key = request.ip ?? 'unknown';
    const since = this.now() - WINDOW_MS;

    const recent = (this.attempts.get(key) ?? []).filter((at) => at > since);
    if (recent.length >= MAX_ATTEMPTS) {
      throw new HttpException('Too many login attempts, retry later', HttpStatus.TOO_MANY_REQUESTS);
    }

    recent.push(this.now());
    this.attempts.set(key, recent);
    this.evict(since);
    return true;
  }

  /**
   * Drops clients whose attempts all fell out of the window, so the map cannot
   * grow without bound under a scan from many addresses.
   */
  private evict(since: number): void {
    for (const [key, stamps] of this.attempts) {
      if (stamps.every((at) => at <= since)) this.attempts.delete(key);
    }
  }
}
