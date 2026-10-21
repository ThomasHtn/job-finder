import { activeLocale, isSingular, pickLocale, toLocale } from './i18n.utils';

describe('i18n utils', () => {
  afterEach(() => {
    document.documentElement.lang = '';
  });

  it('narrows a tag to a language the app speaks, region ignored', () => {
    expect(toLocale('fr-CA')).toBe('fr');
    expect(toLocale('EN')).toBe('en');
    expect(toLocale('de')).toBeNull();
    expect(toLocale(null)).toBeNull();
  });

  it('picks the first browser language the app speaks', () => {
    expect(pickLocale(['fr-FR', 'en-US'])).toBe('fr');
    expect(pickLocale(['de', 'en-GB', 'fr'])).toBe('en');
  });

  it('falls back to English when the browser offers no language the app speaks', () => {
    expect(pickLocale(['de', 'es'])).toBe('en');
    expect(pickLocale([])).toBe('en');
  });

  it('reads the active language from the html element', () => {
    document.documentElement.lang = 'fr';
    expect(activeLocale()).toBe('fr');
    document.documentElement.lang = 'en';
    expect(activeLocale()).toBe('en');
  });

  it('follows the plural rules of the active language', () => {
    document.documentElement.lang = 'fr';
    expect(isSingular(0)).toBe(true);
    expect(isSingular(2)).toBe(false);
    document.documentElement.lang = 'en';
    expect(isSingular(0)).toBe(false);
    expect(isSingular(1)).toBe(true);
  });
});
