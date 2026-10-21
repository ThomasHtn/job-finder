import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Notice } from './notice';

/**
 * Host template rendering one notice of each tone.
 */
@Component({
  imports: [Notice],
  template: `
    <app-notice icon="info">Pour info</app-notice>
    <app-notice tone="alert">En panne</app-notice>
  `,
})
class NoticeHost {}

describe('Notice', () => {
  it('projects its message and tints the alert one', () => {
    const fixture = TestBed.createComponent(NoticeHost);
    fixture.detectChanges();

    const [info, alert] = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('app-notice'),
    );
    expect(info.textContent).toContain('Pour info');
    expect(info.classList).not.toContain('notice--alert');
    expect(alert.classList).toContain('notice--alert');
  });
});
