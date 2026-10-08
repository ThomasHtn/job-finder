/**
 * Class names follow BEM written out in full (block__element--modifier); `u-` marks a utility.
 */
const BEM_CLASS =
  /^(u-)?[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$/;

/**
 * Stylelint rules: the standard SCSS set, plus the design-system rules of the project.
 */
export default {
  extends: ['stylelint-config-standard-scss'],
  rules: {
    'selector-class-pattern': [
      BEM_CLASS,
      { message: 'Class names follow BEM: block__element--modifier.' },
    ],
    /* Safari still needs the prefixed `backdrop-filter`, and older iOS the prefixed `mask`. */
    'property-no-vendor-prefix': [
      true,
      { ignoreProperties: ['-webkit-backdrop-filter', '-webkit-mask'] },
    ],
  },
  overrides: [
    {
      /* Only the token partial holds raw colours; everything else reads custom properties. */
      files: ['apps/web/src/**/*.scss'],
      ignoreFiles: ['apps/web/src/styles/_tokens.scss'],
      rules: {
        'color-no-hex': [true, { message: 'Take colours from the tokens in _tokens.scss.' }],
        'color-named': ['never', { message: 'Take colours from the tokens in _tokens.scss.' }],
        'function-disallowed-list': [
          ['rgb', 'rgba', 'hsl', 'hsla'],
          { message: 'Take colours from the tokens in _tokens.scss.' },
        ],
      },
    },
  ],
};
