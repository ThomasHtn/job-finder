import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ICON_BASE_URL } from './icon.constants';
import { IconName } from './icon.model';

/**
 * Hairline 24px glyph, a file of `public/assets/icons` drawn as a mask over the text colour.
 * Always decorative: the accessible name belongs to the button or link around it.
 * Sized by `--icon-size` (1.25rem by default).
 */
@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon.html',
  styleUrl: './icon.scss',
  host: {
    'aria-hidden': 'true',
    '[style.--icon-url]': 'url()',
  },
})
export class Icon {
  /**
   * Glyph to draw.
   */
  public readonly name = input.required<IconName>();

  /**
   * CSS url of the glyph file, read by the mask.
   */
  protected readonly url = computed(() => `url('${ICON_BASE_URL}/${this.name()}.svg')`);
}
