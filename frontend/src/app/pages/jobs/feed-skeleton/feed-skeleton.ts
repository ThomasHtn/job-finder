import { ChangeDetectionStrategy, Component } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import { Skeleton } from '@shared/skeleton/skeleton';

import { FEED_SKELETON_FACTS, FEED_SKELETON_ROWS } from './feed-skeleton.constants';

/**
 * Placeholder cards shaped like the offer cards, while the first list loads.
 */
@Component({
  selector: 'app-feed-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Skeleton, TranslocoPipe],
  templateUrl: './feed-skeleton.html',
  styleUrl: './feed-skeleton.scss',
  host: { class: 'feed-skeleton', role: 'status' },
})
export class FeedSkeleton {
  /**
   * One entry per placeholder card.
   */
  protected readonly rows = Array.from({ length: FEED_SKELETON_ROWS }, (_, index) => index);

  /**
   * One entry per fact line of a card.
   */
  protected readonly facts = Array.from({ length: FEED_SKELETON_FACTS }, (_, index) => index);
}
