import { TestBed } from '@angular/core/testing';

import { useFrenchTexts } from '@core/i18n/i18n.fixtures';
import { Language } from '@core/i18n/language';
import { useCleanStorage } from '@core/storage/storage.fixtures';

import { SettingsMenu } from './settings-menu';

/**
 * The menu in French, closed, with the given inputs.
 */
async function create(inputs: { sourcesActive?: boolean; degraded?: boolean } = {}) {
  localStorage.setItem('job-finder-locale', 'fr');
  await TestBed.inject(Language).start();
  const fixture = TestBed.createComponent(SettingsMenu);
  for (const [name, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(name, value);
  }
  fixture.detectChanges();
  return fixture;
}

/**
 * The gear button.
 */
function trigger(host: HTMLElement): HTMLButtonElement {
  return host.querySelector<HTMLButtonElement>('.settings-menu__trigger')!;
}

describe('SettingsMenu', () => {
  useFrenchTexts();
  useCleanStorage();

  it('opens and closes from the gear, telling assistive tech', async () => {
    const fixture = await create();
    const host = fixture.nativeElement as HTMLElement;

    expect(trigger(host).getAttribute('aria-label')).toBe('Paramètres');
    expect(trigger(host).getAttribute('aria-expanded')).toBe('false');
    expect(host.querySelector('.settings-menu__panel')).toBeNull();

    trigger(host).click();
    fixture.detectChanges();
    expect(trigger(host).getAttribute('aria-expanded')).toBe('true');
    expect(host.querySelector('.settings-menu__panel')?.textContent).toContain('Sources');

    trigger(host).click();
    fixture.detectChanges();
    expect(host.querySelector('.settings-menu__panel')).toBeNull();
  });

  it('emits the sources pick, closes and gives the focus back to the gear', async () => {
    const fixture = await create();
    const host = fixture.nativeElement as HTMLElement;
    document.body.append(host);
    const picked = vi.fn();
    fixture.componentInstance.sourcesSelected.subscribe(picked);

    trigger(host).click();
    fixture.detectChanges();
    host.querySelector<HTMLButtonElement>('.settings-menu__item--sources')!.click();
    fixture.detectChanges();

    expect(picked).toHaveBeenCalledOnce();
    expect(host.querySelector('.settings-menu__panel')).toBeNull();
    expect(document.activeElement).toBe(trigger(host));
    host.remove();
  });

  it('marks the sources board on screen, and a source down on the gear', async () => {
    const fixture = await create({ sourcesActive: true, degraded: true });
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('.settings-menu__alert-dot')).not.toBeNull();
    trigger(host).click();
    fixture.detectChanges();
    const sources = host.querySelector('.settings-menu__item--sources')!;
    expect(sources.getAttribute('aria-current')).toBe('page');
    expect(sources.classList).toContain('settings-menu__item--alert');
  });

  it('names each language in itself and switches to the one picked', async () => {
    const fixture = await create();
    const host = fixture.nativeElement as HTMLElement;
    document.body.append(host);

    trigger(host).click();
    fixture.detectChanges();
    const french = host.querySelector<HTMLButtonElement>('.settings-menu__item[lang="fr"]')!;
    const english = host.querySelector<HTMLButtonElement>('.settings-menu__item[lang="en"]')!;
    expect(french.textContent?.trim()).toBe('Français');
    expect(french.getAttribute('aria-pressed')).toBe('true');
    expect(english.textContent?.trim()).toBe('English');

    english.click();
    await fixture.whenStable();

    expect(TestBed.inject(Language).active()).toBe('en');
    expect(localStorage.getItem('job-finder-locale')).toBe('en');
    expect(document.activeElement).toBe(trigger(host));
    host.remove();
  });

  it('closes on a press outside, and on Escape with the focus back on the gear', async () => {
    const fixture = await create();
    const host = fixture.nativeElement as HTMLElement;
    document.body.append(host);

    trigger(host).click();
    fixture.detectChanges();
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    fixture.detectChanges();
    expect(host.querySelector('.settings-menu__panel')).toBeNull();

    trigger(host).click();
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(host.querySelector('.settings-menu__panel')).toBeNull();
    expect(document.activeElement).toBe(trigger(host));
    host.remove();
  });

  it('consumes the Escape that closes it, and leaves any other to the page', async () => {
    const fixture = await create();
    const host = fixture.nativeElement as HTMLElement;
    document.body.append(host);

    const idle = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    document.dispatchEvent(idle);
    expect(idle.defaultPrevented).toBe(false);

    trigger(host).click();
    fixture.detectChanges();
    const closing = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    document.dispatchEvent(closing);
    expect(closing.defaultPrevented).toBe(true);
    host.remove();
  });

  it('keeps the panel open on a press inside it, and ignores Escape while closed', async () => {
    const fixture = await create();
    const host = fixture.nativeElement as HTMLElement;
    document.body.append(host);
    const focused = document.activeElement;

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(document.activeElement).toBe(focused);

    trigger(host).click();
    fixture.detectChanges();
    host
      .querySelector('.settings-menu__heading')!
      .dispatchEvent(new Event('pointerdown', { bubbles: true }));
    fixture.detectChanges();
    expect(host.querySelector('.settings-menu__panel')).not.toBeNull();
    host.remove();
  });

  it('only closes when the language picked is already in use', async () => {
    const fixture = await create();
    const host = fixture.nativeElement as HTMLElement;
    const use = vi.spyOn(TestBed.inject(Language), 'use');

    trigger(host).click();
    fixture.detectChanges();
    host.querySelector<HTMLButtonElement>('.settings-menu__item[lang="fr"]')!.click();
    fixture.detectChanges();

    expect(use).not.toHaveBeenCalled();
    expect(host.querySelector('.settings-menu__panel')).toBeNull();
  });

  it('reloads the page when the other language left with a deployment', async () => {
    sessionStorage.clear();
    const fixture = await create();
    const host = fixture.nativeElement as HTMLElement;
    const assign = vi.fn();
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      assign,
      href: 'http://localhost/?tab=remote',
    } as unknown as Location);
    vi.spyOn(TestBed.inject(Language), 'use').mockRejectedValue(
      new TypeError('Failed to fetch dynamically imported module: en-ABC.js'),
    );

    trigger(host).click();
    fixture.detectChanges();
    host.querySelector<HTMLButtonElement>('.settings-menu__item[lang="en"]')!.click();
    await fixture.whenStable();

    expect(assign).toHaveBeenCalledWith('http://localhost/?tab=remote');
    vi.restoreAllMocks();
  });
});
