import { Injectable, signal } from '@angular/core';

/**
 * Below this width the app switches to its mobile shell: tabs at the bottom, detail as a sheet.
 */
const COMPACT_QUERY = '(max-width: 63.99rem)';

/**
 * Which shell the layout is in. The CSS owns the layout itself; this only decides which
 * navigation markup exists, so a bottom bar and a sidebar never coexist in the a11y tree.
 */
@Injectable({ providedIn: 'root' })
export class Viewport {
  /**
   * Null in environments without matchMedia (unit tests), where the wide shell is assumed.
   */
  private readonly query = typeof matchMedia === 'function' ? matchMedia(COMPACT_QUERY) : null;

  /**
   * Writable side of the exposed signal.
   */
  private readonly compact = signal(this.query?.matches ?? false);

  /**
   * True on phones and narrow windows.
   */
  readonly isCompact = this.compact.asReadonly();

  /**
   * Follows the media query for the life of the app.
   */
  constructor() {
    this.query?.addEventListener('change', (event) => this.compact.set(event.matches));
  }
}
