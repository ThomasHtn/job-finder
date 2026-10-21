import { DOCUMENT } from '@angular/common';
import { inject, Service, signal } from '@angular/core';

import { COMPACT_QUERY } from './layout.constants';

/**
 * Which shell the layout is in. The CSS owns the layout itself; this drives what CSS cannot: which
 * navigation markup exists, the sheet's inertness and focus, and the gestures it allows.
 */
@Service()
export class Viewport {
  /**
   * Null where `matchMedia` is missing (unit tests), where the wide shell is assumed.
   */
  private readonly query = inject(DOCUMENT).defaultView?.matchMedia?.(COMPACT_QUERY) ?? null;

  /**
   * Writable side of `isCompact`.
   */
  private readonly compact = signal(this.query?.matches ?? false);

  /**
   * True on phones and narrow windows.
   */
  public readonly isCompact = this.compact.asReadonly();

  /**
   * Follows the media query for the life of the app.
   */
  constructor() {
    this.query?.addEventListener('change', (event) => this.compact.set(event.matches));
  }
}
