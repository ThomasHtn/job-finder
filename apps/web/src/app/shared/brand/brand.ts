import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The JobFinder signature: the mark, and the wordmark next to it unless it is hidden.
 */
@Component({
  selector: 'app-brand',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './brand.html',
  styleUrl: './brand.scss',
  host: { class: 'brand' },
})
export class Brand {
  /**
   * False on screens too narrow for the wordmark; the mark alone still identifies the app.
   */
  readonly showName = input(true);
}
