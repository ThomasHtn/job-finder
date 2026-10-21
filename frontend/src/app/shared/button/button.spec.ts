import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Button } from './button';

/**
 * Host template rendering one button of each variant.
 */
@Component({
  imports: [Button],
  template: `
    <button app-button type="button">Neutral</button>
    <a app-button variant="primary" href="/">Main</a>
  `,
})
class ButtonHost {}

describe('Button', () => {
  it('styles native buttons and links, the primary one filled', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.detectChanges();

    const [neutral, main] = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.button'),
    );
    expect(neutral.tagName).toBe('BUTTON');
    expect(neutral.classList).not.toContain('button--primary');
    expect(main.tagName).toBe('A');
    expect(main.classList).toContain('button--primary');
  });
});
