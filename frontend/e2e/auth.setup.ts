import { expect, test as setup } from '@playwright/test';

import { PASSWORD, SESSION_FILE } from './e2e.constants';
import { tab } from './e2e.utils';

/* One sign-in for the whole run, reused by every test: a real deployment throttles the login route. */
setup('signs in with the shared password', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('Mot de passe').fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrer' }).click();
  await expect(tab(page, /^Favoris/)).toBeVisible();
  await page.context().storageState({ path: SESSION_FILE });
});
