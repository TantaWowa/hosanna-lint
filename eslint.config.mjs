import tseslint from 'typescript-eslint';
import unusedImports from 'eslint-plugin-unused-imports';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const hosannaPlugin = require('./dist/index.js');

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '**/*.d.ts',
      '**/*.js',
      '**/*.test.ts',
      '**/*.spec.ts',
      'src/__test__/**'
    ],
  },
  // Configuration for Hosanna user code files
  {
    files: ['test-user-code.ts', 'test-user-code-no-exclude.ts', 'test-user-example.ts'],
    plugins: {
      '@hosanna-eslint': hosannaPlugin,
    },
    processor: '@hosanna-eslint/ts',
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    rules: {
      ...hosannaPlugin.configs.recommended.rules,
    },
  },
  // Configuration for plugin development
  {
    extends: [
      ...tseslint.configs.recommended,
    ],
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
);
