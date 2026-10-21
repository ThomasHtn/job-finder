/**
 * Films the tour: drives stage.html around two live copies of the app and screenshots it in a loop.
 * Usage: node record.mjs <out dir>, then encode_tour.py turns <out dir> into the animated WebP.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { APP_URL, ROW_TITLE, STAGE_VIEWPORT } from './tour.constants.mjs';
import { chromium, openContext, signIn } from './tour.utils.mjs';

/**
 * Where the frames and their timings land.
 */
const OUT_DIR = process.argv[2];

/**
 * Served on the app's origin, so the stage can reach into both iframes.
 */
const STAGE_URL = `${APP_URL}/__tour`;

if (!OUT_DIR) throw new Error('Usage: node record.mjs <out dir>');
mkdirSync(join(OUT_DIR, 'frames'), { recursive: true });

/**
 * One browser for the whole take.
 */
const browser = await chromium.launch();

/**
 * Signed-in context at the size of the final video.
 */
const context = await openContext(browser, await signIn(), { viewport: STAGE_VIEWPORT });
await context.route(STAGE_URL, (route) =>
  route.fulfill({
    contentType: 'text/html',
    body: readFileSync(new URL('./stage.html', import.meta.url), 'utf8'),
  }),
);

/**
 * The stage, filmed as a whole.
 */
const page = await context.newPage();
await page.goto(STAGE_URL);
await page.evaluate(() => document.fonts.ready);

/* Both apps load before the first frame, so no spinner is ever filmed. */
await page.evaluate((url) => {
  document.getElementById('phone-frame').src = url;
  document.getElementById('desktop-frame').src = url;
}, `${APP_URL}/`);
await page.frameLocator('#phone-frame').locator(ROW_TITLE).first().waitFor();
await page.frameLocator('#desktop-frame').locator(ROW_TITLE).first().waitFor();
await page.waitForTimeout(800);

/**
 * Screenshots with the time each was taken, so playback keeps the real pace.
 */
const frames = [];

/**
 * Cleared once the last scene is over.
 */
let recording = true;

/**
 * Screenshots as fast as the browser allows, alongside the scenes below.
 */
const capture = (async () => {
  while (recording) {
    frames.push({ buffer: await page.screenshot({ type: 'png' }), at: Date.now() });
  }
})();

/**
 * Lets a scene breathe.
 */
const wait = (ms) => page.waitForTimeout(ms);

/**
 * Calls one of the stage's window.tour methods.
 */
const stage = (method, ...args) =>
  page.evaluate(([name, values]) => window.tour[name](...values), [method, args]);

/**
 * Smoothly scrolls a device's window, or one of its scrollable elements.
 */
const scroll = (device, top, selector = null) =>
  page.evaluate(
    ([id, y, target]) => {
      const frame = document.getElementById(`${id}-frame`);
      const scroller = target ? frame.contentDocument.querySelector(target) : frame.contentWindow;
      scroller.scrollTo({ top: y, behavior: 'smooth' });
    },
    [device, top, selector],
  );

/* 1. The problem. */
await stage('show', 'intro');
await wait(3600);

/* 2. The feed, on a phone. */
await stage(
  'caption',
  'The feed',
  'Only what is new.<br><em>Since your last visit.</em>',
  'Fifty-five sources, read morning and evening. Each offer shows up once, however many boards carry it.',
);
await stage('layout', 'phone');
await stage('show', 'scene');
await wait(2400);
await scroll('phone', 900, '.jobs__feed');
await wait(2200);
await scroll('phone', 0, '.jobs__feed');
await wait(1600);

/* 3. An offer opens on a desktop, the list stays. */
await stage('caption', 'Read', 'Open an offer.<em>Keep your place.</em>', '');
await stage('layout', 'desktop');
await wait(1600);
await stage('tap', 'desktop', ROW_TITLE, 1);
await wait(2400);
await scroll('desktop', 260, '.job-detail__scroll');
await wait(1800);
await stage('tap', 'desktop', ROW_TITLE, 0);
await wait(2600);

/* 4. Keeping one, on a phone. */
await stage(
  'caption',
  'Keep',
  'Star it.<br><em>The rest clears itself.</em>',
  'Favorites are kept for good. Every other offer goes after a month.',
);
await stage('layout', 'phone');
await wait(1800);
await stage('tap', 'phone', '.job-row__star', 1);
await wait(1800);

/* 5. Full remote. */
await stage(
  'caption',
  'Full remote',
  'Remote jobs?<br><em>Their own tab.</em>',
  'Fully remote offers from anywhere in the country, next to the ones a short drive away.',
);
await wait(1200);
await stage('tap', 'phone', '.job-tabs__item', 1);
await wait(3000);

/* 6. Sources, on a desktop. */
await stage('caption', 'Sources', 'Every source.<em>One glance.</em>', '');
await stage('layout', 'desktop');
await wait(1400);
await stage('tap', 'desktop', '.settings-menu__trigger', 0);
await wait(900);
await stage('tap', 'desktop', '.settings-menu__item--sources', 0);
await wait(3200);

/* 7. The way out. */
await stage('layout', 'none');
await stage('show', 'outro');
await wait(4200);

recording = false;
await capture;
await browser.close();

/**
 * How long each frame stays on screen: until the next one was taken.
 */
const timings = frames.map(({ at }, index) => (frames[index + 1]?.at ?? at + 70) - at);
frames.forEach(({ buffer }, index) =>
  writeFileSync(join(OUT_DIR, 'frames', `${String(index).padStart(5, '0')}.png`), buffer),
);
writeFileSync(join(OUT_DIR, 'timings.json'), JSON.stringify(timings));
console.log(`${frames.length} frames, ${(timings.reduce((a, b) => a + b, 0) / 1000).toFixed(1)} s`);
