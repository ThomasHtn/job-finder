import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Names of the available glyphs.
 */
export type IconName =
  'star' | 'star-filled' | 'dismiss' | 'refresh' | 'back' | 'external' | 'info' | 'alert' | 'lock';

/**
 * Hairline 24px icon set, drawn inline so the stroke matches the type weight.
 */
@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Shared stroke settings; each case draws one glyph. -->
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      @switch (name()) {
        @case ('star') {
          <path
            d="M12 3.9 14.55 9.1l5.7.83-4.12 4.02.97 5.68L12 16.94l-5.1 2.69.97-5.68L3.75 9.93l5.7-.83z"
          />
        }
        @case ('star-filled') {
          <path
            fill="currentColor"
            d="M12 3.9 14.55 9.1l5.7.83-4.12 4.02.97 5.68L12 16.94l-5.1 2.69.97-5.68L3.75 9.93l5.7-.83z"
          />
        }
        @case ('dismiss') {
          <path d="M3 3l18 18" />
          <path d="M10.6 6.2A9.4 9.4 0 0 1 12 6.1c4.4 0 8 3.4 9.3 5.9a12 12 0 0 1-2.6 3.3" />
          <path d="M6.5 7.6C4.6 8.9 3.4 10.6 2.7 12c1.3 2.5 4.9 5.9 9.3 5.9a9.6 9.6 0 0 0 3.4-.6" />
          <path d="M9.9 10a3 3 0 0 0 4.2 4.2" />
        }
        @case ('refresh') {
          <path d="M20.2 12a8.2 8.2 0 1 1-2.4-5.8" />
          <path d="M20.4 4.4v4.2h-4.2" />
        }
        @case ('back') {
          <path d="M14.5 5.5 8 12l6.5 6.5" />
        }
        @case ('external') {
          <path d="M13.8 4.4h5.8v5.8" />
          <path d="M19.6 4.4 11 13" />
          <path d="M17.6 14v4.2a2 2 0 0 1-2 2H5.8a2 2 0 0 1-2-2V8.4a2 2 0 0 1 2-2H10" />
        }
        @case ('info') {
          <circle cx="12" cy="12" r="8.6" />
          <path d="M12 11.2v5" />
          <path d="M12 8.1h.01" />
        }
        @case ('alert') {
          <path d="M12 4.3 21 19.7H3z" />
          <path d="M12 10v3.9" />
          <path d="M12 17h.01" />
        }
        @case ('lock') {
          <rect x="4.4" y="10.4" width="15.2" height="9.4" rx="2.4" />
          <path d="M8.3 10.4V7.9a3.7 3.7 0 0 1 7.4 0v2.5" />
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-grid;
      place-items: center;
      width: var(--icon-size, 1.25rem);
      height: var(--icon-size, 1.25rem);
    }

    svg {
      width: 100%;
      height: 100%;
      display: block;
    }
  `,
})
export class Icon {
  /**
   * Glyph to draw.
   */
  readonly name = input.required<IconName>();
}
