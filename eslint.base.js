// @ts-check
import eslint from '@eslint/js';
import jsdoc from 'eslint-plugin-jsdoc';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Declarations that must carry a block comment: the project convention, enforced rather than hoped for.
 */
const DOCUMENTED_DECLARATIONS = [
  'ClassDeclaration',
  'FunctionDeclaration',
  'MethodDefinition',
  'PropertyDefinition',
  'TSInterfaceDeclaration',
  'TSTypeAliasDeclaration',
  'TSEnumDeclaration',
  'TSInterfaceBody > TSPropertySignature',
  'TSInterfaceBody > TSMethodSignature',
  'TSTypeAliasDeclaration > TSTypeLiteral > TSPropertySignature',
  'Program > VariableDeclaration',
  'ExportNamedDeclaration[declaration.type="VariableDeclaration"]',
];

/**
 * Spec files only document their shared helpers and fixtures, not every test.
 */
const DOCUMENTED_SPEC_DECLARATIONS = [
  'FunctionDeclaration',
  'Program > VariableDeclaration',
  'ExportNamedDeclaration[declaration.type="VariableDeclaration"]',
];

/**
 * Import order, fixed by `npm run fix`: side effects, Node, frameworks, libraries, contract, aliases, relatives.
 */
const IMPORT_GROUPS = [
  ['^\\u0000'],
  ['^node:'],
  ['^@(angular|nestjs)/'],
  ['^@?\\w'],
  ['^@job-finder/'],
  ['^@(core|shared|pages)/'],
  ['^\\.'],
];

/**
 * Rules shared by the three workspaces, type-aware against the tsconfig of the calling folder.
 * Each workspace's eslint.config.js spreads it, then adds what is specific to its runtime.
 */
export function baseConfig(tsconfigRootDir) {
  return [
    {
      ignores: ['**/dist/**', '**/node_modules/**', '**/.angular/**', '**/coverage/**'],
    },

    /* Every TypeScript file of the workspace. */
    {
      files: ['**/*.ts'],
      extends: [
        eslint.configs.recommended,
        tseslint.configs.recommendedTypeChecked,
        tseslint.configs.stylisticTypeChecked,
      ],
      languageOptions: {
        parserOptions: { projectService: true, tsconfigRootDir },
      },
      plugins: { jsdoc, 'simple-import-sort': simpleImportSort },
      rules: {
        'simple-import-sort/imports': ['error', { groups: IMPORT_GROUPS }],
        'simple-import-sort/exports': 'error',

        /* No declaration without its comment; the fixer is off so it never writes empty blocks. */
        'jsdoc/require-jsdoc': [
          'error',
          {
            require: {},
            contexts: DOCUMENTED_DECLARATIONS,
            checkConstructors: true,
            exemptEmptyConstructors: false,
            enableFixer: false,
          },
        ],
        /* Comments are written as three-line blocks; single-line ones are expanded automatically. */
        'jsdoc/multiline-blocks': ['error', { noSingleLineBlocks: true }],
        'jsdoc/no-blank-blocks': 'error',
        'jsdoc/no-multi-asterisks': 'error',
        'jsdoc/require-asterisk-prefix': 'error',
        /* TypeScript carries the types; the comment carries the intent. */
        'jsdoc/no-types': 'error',

        /* The public surface of a class is stated, not inferred from a missing keyword. */
        '@typescript-eslint/explicit-member-accessibility': [
          'error',
          { accessibility: 'explicit', overrides: { constructors: 'no-public' } },
        ],

        /* State first, then the constructor, then behaviour. */
        '@typescript-eslint/member-ordering': [
          'error',
          { default: { memberTypes: ['signature', 'field', 'constructor', 'method'] } },
        ],

        /* `_`-prefixed parameters are intentionally unused (interface conformance). */
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
        ],

        /* `||` on strings is deliberate: an empty string from a source means "absent" too. */
        '@typescript-eslint/prefer-nullish-coalescing': [
          'error',
          { ignorePrimitives: { string: true } },
        ],

        eqeqeq: ['error', 'always'],
        curly: ['error', 'multi-line'],
        'prefer-const': 'error',
        'no-console': 'error',
      },
    },

    /* Specs: fixtures and mocks are loosely typed on purpose. */
    {
      files: ['**/*.spec.ts', '**/*.fixtures.ts'],
      rules: {
        'jsdoc/require-jsdoc': [
          'error',
          { require: {}, contexts: DOCUMENTED_SPEC_DECLARATIONS, enableFixer: false },
        ],
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/unbound-method': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/require-await': 'off',
        '@typescript-eslint/no-empty-function': 'off',
      },
    },

    /* Config files run on Node, outside any tsconfig. */
    {
      files: ['**/*.{js,mjs}'],
      extends: [eslint.configs.recommended],
      languageOptions: { globals: globals.node },
    },
  ];
}
