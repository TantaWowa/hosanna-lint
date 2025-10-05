import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const hosannaPlugin = require('./dist/index.js');

export default [
  {
    files: ['test-example.ts', 'test-example-normal.ts'],
    plugins: {
      '@hosanna-eslint': hosannaPlugin,
    },
    processor: '@hosanna-eslint/ts',
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    rules: {
      '@hosanna-eslint/no-await-expression': 'error',
    },
  },
];
