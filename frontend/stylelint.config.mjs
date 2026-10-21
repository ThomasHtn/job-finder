/**
 * Class names follow BEM, written out in full: block__element--modifier.
 */
const BEM_CLASS =
  /^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$/;

/**
 * Kebab-case custom properties, plus Tailwind's `--text-xs--line-height` sub-keys.
 */
const CUSTOM_PROPERTY = /^[a-z][a-z0-9]*(-{1,2}[a-z0-9]+)*$/;

/**
 * Tailwind 4 at-rules the token stylesheets use: `@theme` declares the design tokens.
 */
const TAILWIND_AT_RULES = ['theme'];

/**
 * Stylelint rules: the standard SCSS set, plus the conventions of README.md.
 */
export default {
  extends: ['stylelint-config-standard-scss'],
  rules: {
    'selector-class-pattern': [
      BEM_CLASS,
      { message: 'Class names follow BEM: block__element--modifier.' },
    ],
    'custom-property-pattern': [CUSTOM_PROPERTY, { message: 'Custom properties are kebab-case.' }],
    'scss/at-rule-no-unknown': [true, { ignoreAtRules: TAILWIND_AT_RULES }],
    'value-keyword-case': ['lower', { ignoreProperties: ['/^--font/'] }],
    /* Partials are imported by relative path, as plain strings. */
    'import-notation': 'string',
    /* Safari still needs the prefixed `backdrop-filter`, `mask` and line clamp. */
    'property-no-vendor-prefix': [
      true,
      {
        ignoreProperties: [
          '-webkit-backdrop-filter',
          '-webkit-mask',
          '-webkit-box-orient',
          '-webkit-line-clamp',
        ],
      },
    ],
    'value-no-vendor-prefix': [true, { ignoreValues: ['-webkit-box'] }],
  },
  overrides: [
    {
      /* iOS text sizing still needs its -webkit- property. */
      files: ['src/styles/base.css'],
      rules: { 'property-no-vendor-prefix': null },
    },
    {
      /* Components take every value from the tokens, never a literal. */
      files: ['src/app/**/*.scss'],
      rules: {
        'color-no-hex': [true, { message: 'Take colors from the tokens in src/styles/tokens/.' }],
        'color-named': ['never', { message: 'Take colors from the tokens in src/styles/tokens/.' }],
        'function-disallowed-list': [
          ['rgb', 'rgba', 'hsl', 'hsla'],
          { message: 'Use a token, or color-mix() over one.' },
        ],
        'selector-disallowed-list': [
          ['/&__/', '/&--/'],
          { message: 'Write BEM names out in full.' },
        ],
      },
    },
  ],
};
