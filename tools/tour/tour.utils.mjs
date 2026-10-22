import { createRequire } from 'node:module';

import { API_URL, LAST_VISIT_HOUR, TOUR_PASSWORD } from './tour.constants.mjs';

/**
 * Playwright comes from the frontend workspace, which already pins it for the e2e tests.
 */
export const { chromium } = createRequire(new URL('../../frontend/package.json', import.meta.url))(
  'playwright',
);

/**
 * Signs in once through the API and returns the session token.
 */
export async function signIn() {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: TOUR_PASSWORD }),
  });
  if (!response.ok) throw new Error(`Sign-in failed: ${response.status}`);
  return (await response.json()).token;
}

/**
 * Opens a browser context already signed in, in English, back from a visit yesterday evening.
 */
export async function openContext(browser, token, options) {
  const lastVisit = new Date();
  lastVisit.setDate(lastVisit.getDate() - 1);
  lastVisit.setHours(Math.floor(LAST_VISIT_HOUR), (LAST_VISIT_HOUR % 1) * 60, 0, 0);
  const context = await browser.newContext({ locale: 'en-GB', colorScheme: 'dark', ...options });
  await context.addInitScript(
    ([visit, session]) => {
      localStorage.setItem('job-finder-locale', 'en');
      localStorage.setItem('job-finder-last-visit', visit);
      localStorage.setItem('job-finder-token', session);
    },
    [lastVisit.toISOString(), token],
  );
  return context;
}
