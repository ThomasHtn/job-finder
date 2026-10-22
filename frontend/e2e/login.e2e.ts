import { expect, test } from '@playwright/test';

/* A visitor without the session of the setup project. */
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('login', () => {
  test('guards the feed behind the password', async ({ page }) => {
    await page.goto('/?tab=remote');
    /* The page asked for rides along, to come back to it after signing in. */
    await expect(page).toHaveURL(/\/login\?returnUrl=%2F%3Ftab%3Dremote$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText("Votre veille d'offres");
  });

  test('refuses a wrong password', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Mot de passe').fill('not-the-password');
    await page.getByRole('button', { name: 'Entrer' }).click();
    await expect(page.getByRole('alert')).toHaveText('Mot de passe incorrect.');
  });

  test('speaks English before signing in too', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Passer en anglais' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your job watch');
  });
});
