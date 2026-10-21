// @ts-check
import angular from 'angular-eslint';
import { defineConfig } from 'eslint/config';
import globals from 'globals';

import { baseConfig } from '../eslint.base.js';

/**
 * Aliases each layer must not import, with the reason shown on a violation.
 */
const LAYERS = [
  {
    layer: 'core',
    forbidden: ['@shared/*', '@pages/*'],
    message: 'A layer never imports a layer above it.',
  },
  { layer: 'shared', forbidden: ['@pages/*'], message: 'A layer never imports a layer above it.' },
  {
    layer: 'pages',
    forbidden: ['@pages/*'],
    message: 'A page never imports another page: move shared code to core/ or shared/.',
  },
];

/**
 * Message of the relative import rules: crossing folders goes through an alias the layer rules check.
 */
const RELATIVE_MESSAGE =
  'A relative import stays inside its folder: use @core/, @shared/ or @pages/ instead.';

/**
 * Two levels up always leaves the component or feature folder the file belongs to.
 */
const LEAVES_PARENT = { regex: '^\\.\\./\\.\\./', message: RELATIVE_MESSAGE };

/**
 * One level up from a folder's top-level file lands among the other folders of its layer.
 */
const LEAVES_FOLDER = { regex: '^\\.\\./', message: RELATIVE_MESSAGE };

export default defineConfig([
  ...baseConfig(import.meta.dirname),
  { ignores: ['out-tsc/**', 'test-results/**', 'playwright-report/**'] },

  /* Angular app: component conventions on top of the shared TypeScript rules. */
  {
    files: ['src/**/*.ts'],
    extends: [angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    languageOptions: { globals: globals.browser },
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      /* Attribute selectors too, so buttons and links stay native elements (`<button app-button>`). */
      '@angular-eslint/component-selector': [
        'error',
        { type: ['element', 'attribute'], prefix: 'app', style: 'kebab-case' },
      ],
      /* OnPush everywhere: with signals and zoneless, a component only renders when its inputs change. */
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      /* Diagnostics are fine; stray debug logging is not. */
      'no-console': ['error', { allow: ['error', 'warn'] }],
    },
  },

  /* Browser tests run on Node, against the app from its images. */
  {
    files: ['e2e/**/*.ts', 'playwright.config.ts'],
    languageOptions: { globals: globals.node },
  },

  /*
   * Layering, see README.md: core <- shared <- pages, a layer never imports one above it and a page never
   * imports another page. A relative import never leaves its folder, so it cannot dodge the aliases.
   */
  ...LAYERS.flatMap(({ layer, forbidden, message }) =>
    [
      [`src/app/${layer}/**/*.ts`, LEAVES_PARENT],
      [`src/app/${layer}/*/*.ts`, LEAVES_FOLDER],
    ].map(([files, relative]) => ({
      files: [files],
      rules: {
        'no-restricted-imports': ['error', { patterns: [{ group: forbidden, message }, relative] }],
      },
    })),
  ),

  {
    files: ['src/**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {
      /* Buttons always declare their type so they never submit a surrounding form by accident. */
      '@angular-eslint/template/button-has-type': 'error',
      /* Native control flow only; no residual structural directives. */
      '@angular-eslint/template/prefer-control-flow': 'error',
      '@angular-eslint/template/prefer-self-closing-tags': 'error',
      '@angular-eslint/template/eqeqeq': 'error',
      '@angular-eslint/template/no-positive-tabindex': 'error',
    },
  },
]);
