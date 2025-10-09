import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const hosannaPlugin = require('./dist/index.js');

export default [
  {
    files: ['test-isnan.ts'],
    plugins: {
      '@hosanna-eslint': hosannaPlugin,
    },
    rules: {
      ...hosannaPlugin.configs.recommended.rules,
    },
  },
];
