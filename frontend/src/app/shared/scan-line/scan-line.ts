import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Indeterminate progress: a single sweep along the bottom edge of the positioned parent, no chrome.
 */
@Component({
  selector: 'app-scan-line',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './scan-line.html',
  styleUrl: './scan-line.scss',
  host: {
    'aria-hidden': 'true',
    '[class.scan-line--active]': 'active()',
  },
})
export class ScanLine {
  /**
   * Whether something is loading; the line fades out otherwise.
   */
  public readonly active = input(false);
}
