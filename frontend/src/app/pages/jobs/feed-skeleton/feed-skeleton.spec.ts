import { TestBed } from '@angular/core/testing';

import { useFrenchTexts } from '@core/i18n/i18n.fixtures';

import { FeedSkeleton } from './feed-skeleton';
import { FEED_SKELETON_ROWS } from './feed-skeleton.constants';

describe('FeedSkeleton', () => {
  useFrenchTexts();

  it('draws the placeholder rows and says once what loads', () => {
    const fixture = TestBed.createComponent(FeedSkeleton);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('.feed-skeleton__row')).toHaveLength(FEED_SKELETON_ROWS);
    expect(host.getAttribute('role')).toBe('status');
    expect(host.textContent).toContain('Chargement des offres');
  });
});
