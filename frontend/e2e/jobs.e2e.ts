import { expect, test } from '@playwright/test';

import { openFirstOffer, tab, tabCount } from './e2e.utils';

test.describe('feed', () => {
  test('lists the on-site offers with their counts on every tab', async ({ page }) => {
    await page.goto('/');

    await expect(tab(page, /^Full remote/)).toBeVisible();
    await expect(page.locator('app-job-row').first()).toBeVisible();
    expect(await tabCount(page, 'Full remote')).toBeGreaterThan(0);
    await expect(page.getByText('commune non précisée').first()).toBeVisible();
  });

  test('switches tab through the URL', async ({ page }) => {
    await page.goto('/');
    await tab(page, /^Full remote/).click();

    await expect(page).toHaveURL(/tab=remote/);
    await expect(tab(page, /^Full remote/)).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('app-job-row').first()).toContainText('Full remote');
  });

  test('opens an offer next to the feed, then closes it', async ({ page }) => {
    await page.goto('/');
    await openFirstOffer(page);

    await expect(page.getByRole('link', { name: /Voir l'offre sur/ })).toBeVisible();
    await page.getByRole('button', { name: "Fermer l'offre" }).click();
    await expect(page).not.toHaveURL(/\/offres\//);
  });

  test('stars an offer from its panel, and the favourites tab counts it', async ({ page }) => {
    await page.goto('/');
    /* The counts arrive with the feed: read them once it is drawn, not from the empty shell. */
    await expect(page.locator('app-job-row').first()).toBeVisible();
    const before = await tabCount(page, 'Favoris');
    await openFirstOffer(page);

    const star = page.locator('app-job-detail-page').getByRole('button', { name: /favoris/ });
    const starred = (await star.getAttribute('aria-pressed')) === 'true';
    try {
      await star.click();
      await expect(star).toHaveAttribute('aria-pressed', String(!starred));
      await expect.poll(() => tabCount(page, 'Favoris')).toBe(before + (starred ? -1 : 1));
    } finally {
      /* Puts the star back whatever happened above, so a failure here never leaks into the next test. */
      await page.waitForLoadState('networkidle');
      if ((await star.getAttribute('aria-pressed')) !== String(starred)) {
        await star.click();
      }
    }

    await expect(star).toHaveAttribute('aria-pressed', String(starred));
    await expect.poll(() => tabCount(page, 'Favoris')).toBe(before);
  });

  test('switches the whole shell to English and back', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Paramètres' }).click();
    await page.getByRole('button', { name: 'English' }).click();

    await expect(tab(page, /^Favorites/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Search for new offers' })).toBeVisible();

    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'Français' }).click();
    await expect(tab(page, /^Favoris/)).toBeVisible();
  });

  test('shows the health of every source from the settings, a failing one included', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Paramètres' }).click();
    /* Exact: the warning triangle of a failing source speaks of sources too. */
    await page.getByRole('button', { name: 'Sources', exact: true }).click();

    await expect(page).toHaveURL(/tab=sources/);
    await expect(page.locator('app-source-board')).toContainText('France Travail');
    await expect(page.locator('app-source-board')).toContainText('En échec');
  });
});
