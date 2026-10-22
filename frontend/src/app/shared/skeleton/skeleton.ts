import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Placeholder block of content still loading, sized by the parent's class.
 * Usage: `<app-skeleton class="feed__title-placeholder" />`.
 */
@Component({
  selector: 'app-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './skeleton.html',
  styleUrl: './skeleton.scss',
  host: { class: 'skeleton', 'aria-hidden': 'true' },
})
export class Skeleton {}
