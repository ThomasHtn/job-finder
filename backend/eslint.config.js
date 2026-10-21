// @ts-check
import { defineConfig } from 'eslint/config';
import globals from 'globals';

import { baseConfig } from '../eslint.base.js';

export default defineConfig([
  ...baseConfig(import.meta.dirname),
  { ignores: ['src/generated/**'] },

  /* The API runs on Node and logs through Nest's Logger. */
  {
    files: ['**/*.ts'],
    languageOptions: { globals: globals.node },
  },

  /* Command-line scripts talk to whoever runs them. */
  {
    files: ['src/cli/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
]);
