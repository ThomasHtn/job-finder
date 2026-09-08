import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { IconName } from './icon-name';

/**
 * Hairline 24px icon set: every glyph is an SVG file of `public/icons`, tinted with currentColor.
 */
@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon.html',
  styleUrl: './icon.scss',
})
export class Icon {
  /**
   * Glyph to draw.
   */
  readonly name = input.required<IconName>();
}
