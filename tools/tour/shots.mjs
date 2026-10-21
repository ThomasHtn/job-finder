/**
 * Takes the phone screenshots of the README strip, raw: frame_screens.py draws the phone around them.
 * Usage: node shots.mjs <out dir>
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { APP_URL, PHONE_DEVICE, ROW_TITLE } from './tour.constants.mjs';
import { chromium, openContext, signIn } from './tour.utils.mjs';

/**
 * Where the raw screenshots land, one PNG per screen.
 */
const OUT_DIR = process.argv[2];

if (!OUT_DIR) throw new Error('Usage: node shots.mjs <out dir>');
mkdirSync(OUT_DIR, { recursive: true });

/**
 * One browser for every screen.
 */
const browser = await chromium.launch();

/**
 * Shared by every context below.
 */
const token = await signIn();

/**
 * Opens the feed on a phone, loaded and settled, in the given colour scheme.
 */
async function openFeed(colorScheme) {
  const context = await openContext(browser, token, {
    ...PHONE_DEVICE,
    colorScheme,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await page.goto(`${APP_URL}/`);
  await page.locator(ROW_TITLE).first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  return page;
}

/**
 * Saves the page as `<name>.png`, after the UI has settled.
 */
async function shoot(page, name) {
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(OUT_DIR, `${name}.png`) });
}

/**
 * Switches to a tab of the bottom bar, counted from the area tab.
 */
const openTab = (page, index) =>
  page.locator('.job-tabs__item').filter({ visible: true }).nth(index).click();

/**
 * The light feed, reused for the offer, the remote tab and the sources.
 */
const page = await openFeed('light');
await shoot(page, 'feed');
await page.locator(ROW_TITLE).nth(1).click();
await shoot(page, 'detail');
await page.goto(`${APP_URL}/`);
await page.locator(ROW_TITLE).first().waitFor();
await openTab(page, 1);
await shoot(page, 'remote');
await page.locator('.settings-menu__trigger').filter({ visible: true }).click();
await page.locator('.settings-menu__item--sources').click();
await shoot(page, 'sources');
await shoot(await openFeed('dark'), 'dark');

await browser.close();
