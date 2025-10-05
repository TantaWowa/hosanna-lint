import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const hosannaPlugin = require('./dist/index.js');

export default [
  {
    files: ['test-final.ts'],
    plugins: {
      '@hosanna-eslint': hosannaPlugin,
    },
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    rules: {
      '@hosanna-eslint/no-nan-usage': 'error',
      '@hosanna-eslint/no-isnan-emulated': 'warn',
    },
  },
];
