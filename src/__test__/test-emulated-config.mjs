import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const hosannaPlugin = require('./dist/index.js');
const parser = require('@typescript-eslint/parser');

export default [
  {
    files: ['test-isnan-emulated.ts'],
    plugins: {
      '@hosanna-eslint': hosannaPlugin,
    },
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parser,
    },
    rules: {
      '@hosanna-eslint/no-isnan-emulated': 'warn',
    },
  },
];
