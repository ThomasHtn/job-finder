# Job Finder frontend

The part you actually read. One Angular app that lists the offers, opens one beside the feed, and gets out of the way: no search form, no settings screen, nothing between you and the next CDI.

## Start

From the repository root, the first time:

```bash
npx npm@11 install
npm run build --workspace contract
```

Then every day, with the backend running on port 3001:

```bash
npm start --workspace frontend
```

The app opens on http://localhost:4201 and relays `/api` to the API (`proxy.conf.json`).

## Before committing

```bash
npm run fix
npm run test:ci
```

The first one fixes lint, styles and formatting, the second runs the tests once with the coverage floors of `angular.json`.

## Tests while coding

```bash
npm test
```

One file only:

```bash
npm test -- --include src/app/pages/jobs/jobs.spec.ts
```

## Browser tests

They drive the real app from its images, against the demo offers of the compose stack. Once, install the browser:

```bash
npx playwright install chromium
```

Then:

```bash
make -C .. up
npm run e2e
```

They expect the stack on http://localhost:8001 and its demo password. Another stack: `E2E_BASE_URL=https://... E2E_PASSWORD=... npm run e2e`.

## Where code goes

```text
core/     data access, models, pure functions
shared/   reusable components, one folder each
pages/    one folder per screen
```

Imports roll downhill only: a page may use shared and core, shared may use core, core uses neither. A page never imports another page. To reach another folder, use the `@core`, `@shared` or `@pages` aliases. ESLint catches anyone climbing back up.

The API contract (`JobSummary`, `ApiError`...) comes from `@job-finder/contract`, built from `../contract`. Change a type there, rebuild it, and let the compiler walk you through the screens.

URLs live in `core/http/api-endpoints.ts`. Reads go through `httpResource`, writes through a service of `core/` with `firstValueFrom`. Read a resource with `resourceValue(resource, fallback)`, or `lastValue(resource, fallback)` when the screen must keep the previous answer while the next one loads.

Glyphs are single-colour SVG files in `public/assets/icons`, drawn as a mask by `<app-icon>`. A new one is a file plus its name in `ICON_NAMES`.

One exception to "never drawn in a template": the brand mark in `shared/brand/brand.html` is an inline SVG, because it is two-tone (ink and accent) and must follow the colour scheme, which a mask or an `<img>` cannot do.

## Translations

Every text lives in both `src/i18n/fr.json` and `src/i18n/en.json`. A spec fails if one file has a key the other lacks.

In a template:

```html
{{ 'login.title' | transloco }} {{ 'detail.applyOn' | transloco: { source: job.sourceLabel } }}
```

In TypeScript, translate at the moment you need the text, never in a constant at the top of a file. A `computed` that builds a text reads `language.active()` first, so it follows a switch from the settings menu:

```ts
protected readonly place = computed(() => {
  this.language.active();
  return rowPlaceLabel(this.job());
});
```

Plurals use `isSingular(count)` with two keys, `xOne` and `xOther`.

The language is browser-local: the stored choice, else the browser's, else English. The on-site tab label is not translated: it comes from the backend `.env` through `/api/config`.

## Styles

Tailwind classes in the template, for layout only. Everything visual goes in the component's `.scss`, with BEM classes written out in full and tokens, never raw colours:

```scss
@use 'tools' as *;

.job-row__source {
  color: var(--color-ink-2);
  font-weight: 500;
}

.jobs__fresh {
  @include motion {
    transition: background-color 0.16s ease;
  }
}
```

The palette, both schemes, lives in `src/styles/tokens/colors.css`. Animations always sit inside the `motion` mixin, so they hold still for anyone who asked for less motion. The start-up screen lives in `index.html` and `src/styles/splash.css`, faded out by the app after its first navigation; content still loading shows `<app-skeleton>` blocks shaped like what is coming. Two typefaces, self-hosted under `public/fonts`: Outfit for titles and the main buttons (`--font-display`), Nunito Sans for everything else (`--font-sans`).

## Banana peels

**npm install crashes**: npm 10.9 trips on jsdom. Use `npx npm@11 install`.

**Cannot find module '@job-finder/contract'**: the contract is consumed built. Run `npm run build --workspace contract` from the root.

**A resource throws**: `value()` throws on error. Read it with `resourceValue(resource, fallback)`.

**A text keeps the old language after a switch**: it was built in a `computed` that never read `language.active()`.

**A pure pipe keeps the old language**: pass `language.active()` as its argument, like `| syncLabel: language.active()`.
