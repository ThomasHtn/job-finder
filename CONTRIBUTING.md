# Contributing

How the code is laid out, the rules it follows, and the recipes for the changes that come up
most. The tooling enforces most of these rules: when in doubt, run `npm run fix` then
`npm run check`.

## Daily workflow

```bash
npm run dev      # api on :3001 and web on :4201, both reloading on save
npm run fix      # formats and applies every lint autofix
npm run check    # what CI runs: format, lint, typecheck, test, build
```

A pre-commit hook (husky + lint-staged) formats and lints the staged files. A commit that still
breaks a rule is refused, with the file and the line to fix.

Commit messages follow `type(scope): Subject`, for example `feat(sources): Add Jooble` or
`fix(geo): Point the isochrone script at the moved constants file`. Types: `feat`, `fix`,
`refactor`, `style`, `test`, `docs`, `chore`.

## Layout

```
apps/api/src/
  <feature>/          one NestJS module per feature: auth, config, geo, ingestion, jobs, sources
  sources/<source>/   one folder per job board, all implementing JobSourceConnector
apps/web/src/app/
  core/               app-wide services: auth, i18n, HTTP helpers, viewport
  shared/             presentational building blocks: icon, brand, language toggle
  features/           screens: jobs (the list and its panel), sources, login
packages/shared/src/  the API contract, one type per file, imported by both apps
```

In the web app a layer only imports from the layers below it: `features` may use `shared` and
`core`, `shared` may use `core`, `core` uses neither. ESLint refuses an import going the other
way. Imports that leave their area go through the `@core/`, `@shared/` and `@features/`
aliases rather than `../../`, which ESLint also refuses.

## One concern per file

A file holds one thing, named after it.

| Content                                | File                                            |
| -------------------------------------- | ----------------------------------------------- |
| Constants (URLs, limits, timeouts)     | `<feature>.constants.ts`                        |
| Shapes of a remote API's responses     | `<feature>.types.ts`                            |
| One result of a source into a `RawJob` | `<source>.mapper.ts`                            |
| Any other pure helper                  | a file named after it: `is-transient-status.ts` |
| The class or service                   | its behaviour only, importing the above         |
| An Angular component                   | `.ts` + `.html` + `.scss`, never inline         |
| A glyph                                | an SVG under `apps/web/public/icons/`           |

Pure helpers come with a `.spec.ts` next to them: they are the cheapest code to test.

## Comments

Every declaration carries a comment: classes, constructors, fields, methods, functions,
interfaces and their fields, types and top-level constants. ESLint (`jsdoc/require-jsdoc`)
reports any that is missing.

- TypeScript uses three-line blocks, never `//`:

  ```ts
  /**
   * Offers not seen for this long are dropped, unless they were favourited.
   */
  private readonly staleAfterDays: number;
  ```

- Templates use one inline comment above each significant block:

  ```html
  <!-- Thin progress line under the bar while anything loads. -->
  <div class="scan" [class.scan--on]="loading()" aria-hidden="true"></div>
  ```

- Short (one line, two at most), in English, and about _why_ or _what for_, never a paraphrase
  of the name. A comment that goes stale is worse than none: update it with the code.
- Spec files only comment their helpers and `describe` blocks, not every test.

## Styles

Colours exist only in `apps/web/src/styles/_tokens.scss` (both light and dark); every other
stylesheet reads the custom properties. Class names follow BEM, written out in full
(`head__refresh--degraded`), with `u-` for utilities. Stylelint enforces both.

## Recipes

### Add a job source

1. Add its identifier to `JOB_SOURCES` in `packages/shared/src/job-source.ts`, and to the
   `JobSourceType` enum in `apps/api/prisma/schema.prisma`, then `npm run db:migrate`.
2. Create `apps/api/src/sources/<source>/` with `<source>.constants.ts`, `<source>.types.ts`
   (the response shapes), `<source>.mapper.ts` (+ spec) turning one result into a `RawJob`, and
   `<source>.source.ts` implementing `JobSourceConnector`. `isEnabled()` returns false when its
   credentials are missing: the source is then skipped, not failed.
3. Register the class in `sources/sources.module.ts`, in both `providers` and `inject`.
4. Add its credentials to `config/env.schema.ts` and `.env.example`, and its label to both
   dictionaries in `apps/web/src/app/core/i18n/`.

### Change a field of the API contract

1. Edit the type in `packages/shared/src/`, then `npm run build -w @job-finder/shared`.
2. Update the Prisma-to-DTO mapping in `apps/api/src/jobs/job.mapper.ts`.
3. Follow the compiler errors through the Angular components.

### Add a word to the UI

Add the key to `core/i18n/fr.ts` first: French defines the shape, so the build fails until
`en.ts` has it too. Read it in the template as `t().section.key`.

### Add an icon

Drop a single-colour SVG in `apps/web/public/icons/`, then add its name to `icon-name.ts` and
its rule to `icon.scss`.
