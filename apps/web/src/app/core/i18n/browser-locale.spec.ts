import { browserLocale } from './browser-locale';

/**
 * Which language the app opens in before the reader has picked one.
 */
describe('browserLocale', () => {
  it('takes the first preference the UI speaks', () => {
    expect(browserLocale(['fr-FR', 'en-US'])).toBe('fr');
    expect(browserLocale(['en-GB', 'fr'])).toBe('en');
  });

  it('ignores the region', () => {
    expect(browserLocale(['fr-CA'])).toBe('fr');
  });

  it('skips languages it does not have', () => {
    expect(browserLocale(['de', 'es', 'fr'])).toBe('fr');
  });

  it('falls back to English when nothing matches', () => {
    expect(browserLocale(['de', 'es'])).toBe('en');
    expect(browserLocale([])).toBe('en');
  });
});
