import { TestBed } from '@angular/core/testing';

import { HealthAlert } from './health-alert';

/**
 * The triangle with the given sentence.
 */
function create(label = '5/6 sources disponibles - en échec : APEC') {
  const fixture = TestBed.createComponent(HealthAlert);
  fixture.componentRef.setInput('label', label);
  fixture.detectChanges();
  return fixture;
}

/**
 * The tooltip element.
 */
function tip(host: HTMLElement): HTMLElement {
  return host.querySelector<HTMLElement>('.health-alert__tip')!;
}

describe('HealthAlert', () => {
  it('names the triangle with the sentence its tooltip shows', () => {
    const host = create().nativeElement as HTMLElement;

    expect(host.querySelector('button')?.getAttribute('aria-label')).toBe(
      '5/6 sources disponibles - en échec : APEC',
    );
    expect(tip(host).textContent?.trim()).toBe('5/6 sources disponibles - en échec : APEC');
  });

  it('holds the tooltip open on a press and lets a press elsewhere close it', () => {
    const fixture = create();
    const host = fixture.nativeElement as HTMLElement;

    host.querySelector('button')!.click();
    fixture.detectChanges();
    expect(tip(host).classList).toContain('health-alert__tip--open');

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    fixture.detectChanges();
    expect(tip(host).classList).not.toContain('health-alert__tip--open');
  });
});
