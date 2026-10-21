import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { EmptyState } from './empty-state';

/**
 * Host template rendering an empty state with and without actions.
 */
@Component({
  imports: [EmptyState],
  template: `
    <app-empty-state title="Rien" hint="Revenez plus tard" />
    <app-empty-state title="Erreur"><button type="button">Réessayer</button></app-empty-state>
  `,
})
class EmptyStateHost {}

describe('EmptyState', () => {
  it('shows its text, and the projected actions when any', () => {
    const fixture = TestBed.createComponent(EmptyStateHost);
    fixture.detectChanges();

    const [quiet, failed] = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('app-empty-state'),
    );
    expect(quiet.textContent).toContain('Revenez plus tard');
    expect(quiet.querySelector('button')).toBeNull();
    expect(failed.querySelector('.empty-state__hint')).toBeNull();
    expect(failed.querySelector('button')?.textContent).toBe('Réessayer');
  });
});
