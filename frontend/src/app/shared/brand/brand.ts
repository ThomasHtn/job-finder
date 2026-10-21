import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The JobFinder signature: the mark, and the wordmark next to it.
 */
@Component({
  selector: 'app-brand',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './brand.html',
  styleUrl: './brand.scss',
  host: { class: 'brand' },
})
export class Brand {}
