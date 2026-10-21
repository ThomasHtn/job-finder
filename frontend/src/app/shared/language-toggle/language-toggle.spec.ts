import { TestBed } from '@angular/core/testing';

import { useFrenchTexts } from '@core/i18n/i18n.fixtures';
import { Language } from '@core/i18n/language';
import { useCleanStorage } from '@core/storage/storage.fixtures';

import { LanguageToggle } from './language-toggle';

describe('LanguageToggle', () => {
  useFrenchTexts();
  useCleanStorage();

  beforeEach(async () => {
    localStorage.setItem('job-finder-locale', 'fr');
    await TestBed.inject(Language).start();
  });

  it('shows the language in use and names the other one', () => {
    const fixture = TestBed.createComponent(LanguageToggle);
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    expect(button.textContent?.trim()).toBe('FR');
    expect(button.getAttribute('aria-label')).toBe('Passer en anglais');
  });

  it('switches to the other language and remembers it', async () => {
    const fixture = TestBed.createComponent(LanguageToggle);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelector('button')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    expect(button.textContent?.trim()).toBe('EN');
    expect(button.getAttribute('aria-label')).toBe('Switch to French');
    expect(localStorage.getItem('job-finder-locale')).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });
});
