import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Round glyph-only button, sized for a thumb on touch screens. Its accessible name comes from the
 * parent's `aria-label`. Usage: `<button app-icon-button type="button" aria-label="..."><app-icon /></button>`.
 */
@Component({
  selector: 'button[app-icon-button]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-button.html',
  styleUrl: './icon-button.scss',
  host: { class: 'icon-button' },
})
export class IconButton {}
