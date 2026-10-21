import { TestBed } from '@angular/core/testing';

import { JobTabItem } from '../jobs.model';
import { JobTabs } from './job-tabs';

/**
 * The four entries of the shell, sources last and uncounted.
 */
const ITEMS: JobTabItem[] = [
  { tab: 'local', label: 'Normandie', count: 3, icon: 'pin' },
  { tab: 'remote', label: 'Full remote', count: 1, icon: 'remote' },
  { tab: 'favorites', label: 'Favoris', count: 0, icon: 'star' },
  { tab: 'sources', label: 'Sources', count: null, icon: 'pulse' },
];

describe('JobTabs', () => {
  /**
   * The strip with `remote` as the current tab.
   */
  function create() {
    const fixture = TestBed.createComponent(JobTabs);
    fixture.componentRef.setInput('label', 'Rubriques');
    fixture.componentRef.setInput('items', ITEMS);
    fixture.componentRef.setInput('current', 'remote');
    fixture.detectChanges();
    return fixture;
  }

  it('is a named navigation landmark marking the current entry', () => {
    const host = create().nativeElement as HTMLElement;
    const buttons = [...host.querySelectorAll('button')];

    expect(host.getAttribute('role')).toBe('navigation');
    expect(host.getAttribute('aria-label')).toBe('Rubriques');
    expect(buttons.map((button) => button.getAttribute('aria-current'))).toEqual([
      null,
      'page',
      null,
      null,
    ]);
  });

  it('counts the offer tabs only', () => {
    const host = create().nativeElement as HTMLElement;

    expect(
      [...host.querySelectorAll('.job-tabs__count')].map((count) => count.textContent),
    ).toEqual(['3', '1', '0']);
  });

  it('emits the tab pressed', () => {
    const fixture = create();
    const selected = vi.fn();
    fixture.componentInstance.selected.subscribe(selected);

    (fixture.nativeElement as HTMLElement).querySelectorAll('button')[2].click();

    expect(selected).toHaveBeenCalledWith('favorites');
  });
});
