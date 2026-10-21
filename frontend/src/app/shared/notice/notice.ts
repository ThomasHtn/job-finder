import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Icon } from '@shared/icon/icon';
import { IconName } from '@shared/icon/icon.model';

import { NoticeTone } from './notice.model';

/**
 * Quiet inline message: something the reader should know, not something they broke.
 * Usage: `<app-notice tone="alert" icon="alert">{{ message }}</app-notice>`.
 */
@Component({
  selector: 'app-notice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './notice.html',
  styleUrl: './notice.scss',
  host: {
    class: 'notice',
    '[class.notice--alert]': "tone() === 'alert'",
    '[attr.role]': "tone() === 'alert' ? 'alert' : null",
  },
})
export class Notice {
  /**
   * Plain by default; `alert` tints it with the failure colour.
   */
  public readonly tone = input<NoticeTone>('info');

  /**
   * Glyph in front of the text.
   */
  public readonly icon = input<IconName>('alert');
}
