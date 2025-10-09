import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const hosannaPlugin = require('./dist/index.js');
const parser = require('@typescript-eslint/parser');

export default [
  {
    files: ['test-exclude.ts', 'test-include.ts'],
    plugins: {
      '@hosanna-eslint': hosannaPlugin,
    },
    processor: '@hosanna-eslint/ts',
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parser,
    },
    rules: {
      '@hosanna-eslint/no-nan-usage': 'error',
      '@hosanna-eslint/no-isnan-emulated': 'warn',
    },
  },
];
