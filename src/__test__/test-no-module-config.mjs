import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const hosannaPlugin = require('./dist/index.js');

export default [
  {
    files: ['test-no-module.ts'],
    plugins: {
      '@hosanna-eslint': hosannaPlugin,
    },
    processor: '@hosanna-eslint/ts',
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parser: require('@typescript-eslint/parser'),
    },
    rules: {
      '@hosanna-eslint/no-function-reference-outside-module': 'error',
    },
  },
];
