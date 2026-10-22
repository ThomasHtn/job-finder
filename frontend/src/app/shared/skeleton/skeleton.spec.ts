import { TestBed } from '@angular/core/testing';

import { Skeleton } from './skeleton';

describe('Skeleton', () => {
  it('is hidden from assistive technologies, the parent says what loads', () => {
    const fixture = TestBed.createComponent(Skeleton);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('skeleton');
    expect(host.getAttribute('aria-hidden')).toBe('true');
  });
});
