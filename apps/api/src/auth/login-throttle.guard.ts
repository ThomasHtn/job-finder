import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

/**
 * Failed attempts tolerated per client before it is locked out.
 */
export const MAX_ATTEMPTS = 5;

/**
 * Sliding window over which the attempts are counted.
 */
export const WINDOW_MS = 15 * 60 * 1000;

/**
 * Timestamps of the recent attempts of one client, oldest first.
 */
type Attempts = number[];

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
   * Clock, a property rather than a constructor parameter so Nest has nothing
   * to inject; tests replace it to move time forward.
   */
  protected now: () => number = Date.now;

  /**
   * Records the attempt and rejects the request once the client is over quota.
   * Every call counts, successful or not: the login route is cheap to retry.
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = request.ip ?? 'unknown';
    const since = this.now() - WINDOW_MS;

    const recent = (this.attempts.get(key) ?? []).filter((at) => at > since);
    if (recent.length >= MAX_ATTEMPTS) {
      throw new HttpException(
        'Too many login attempts, retry later',
        HttpStatus.TOO_MANY_REQUESTS,
      );
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
