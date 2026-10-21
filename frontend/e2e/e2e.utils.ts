import { expect, Locator, Page } from '@playwright/test';

/**
 * The tab of that name, in the header on a wide screen or in the bottom bar on a phone: a button of
 * the sections landmark, named in French or in English.
 */
export function tab(page: Page, name: string | RegExp): Locator {
  return page
    .getByRole('navigation', { name: /^(Rubriques|Sections)$/ })
    .getByRole('button', { name });
}

/**
 * Offers counted on a tab, read from its label ("Favoris 2").
 */
export async function tabCount(page: Page, name: string): Promise<number> {
  const label = await tab(page, new RegExp(`^${name}`)).innerText();
  return Number(/(\d+)\s*$/.exec(label)?.[1] ?? Number.NaN);
}

/**
 * Opens the first offer of the feed and waits for its panel.
 */
export async function openFirstOffer(page: Page): Promise<void> {
  const link = page.getByRole('main').getByRole('link').first();
  const title = (await link.innerText()).trim();
  await link.click();
  await expect(page).toHaveURL(/\/offres\//);
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
}
