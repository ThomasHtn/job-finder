import { DestroyRef, inject, Service, signal } from '@angular/core';

import { CLOCK_TICK_MS } from './date.constants';

/**
 * The current time as a signal, moved every minute, so relative labels ("5 min ago", "Yesterday")
 * age while the app stays open. Pure pipes take it as an argument and recompute on each tick.
 */
@Service()
export class Clock {
  /**
   * Writable side of `now`.
   */
  private readonly current = signal(new Date());

  /**
   * Now, to the minute.
   */
  public readonly now = this.current.asReadonly();

  /**
   * Ticks for the life of the app; stopped with it, so tests never leak a timer.
   */
  constructor() {
    const timer = setInterval(() => this.current.set(new Date()), CLOCK_TICK_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
}
