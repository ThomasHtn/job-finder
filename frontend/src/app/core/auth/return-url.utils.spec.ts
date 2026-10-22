import { loginUrlFor, safeReturnUrl } from './return-url.utils';

describe('safeReturnUrl', () => {
  it('keeps a path of the app, query included', () => {
    expect(safeReturnUrl('/offres/job-1')).toBe('/offres/job-1');
    expect(safeReturnUrl('/?tab=remote')).toBe('/?tab=remote');
  });

  it('falls back to the feed on anything that could leave the app', () => {
    expect(safeReturnUrl('//evil.test')).toBe('/');
    expect(safeReturnUrl('/\\evil.test')).toBe('/');
    expect(safeReturnUrl('https://evil.test')).toBe('/');
    expect(safeReturnUrl('javascript:alert(1)')).toBe('/');
  });

  it('falls back to the feed on a missing or foreign value, and never loops on the login screen', () => {
    expect(safeReturnUrl(undefined)).toBe('/');
    expect(safeReturnUrl(['/a', '/b'])).toBe('/');
    expect(safeReturnUrl('/login?returnUrl=%2F')).toBe('/');
  });
});

describe('loginUrlFor', () => {
  it('carries the page the reader wanted', () => {
    expect(loginUrlFor('/offres/job-1')).toBe('/login?returnUrl=%2Foffres%2Fjob-1');
  });

  it('stays plain when there is nothing to come back to', () => {
    expect(loginUrlFor('/')).toBe('/login');
    expect(loginUrlFor('/login')).toBe('/login');
    expect(loginUrlFor('//evil.test')).toBe('/login');
  });
});
