import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-json-imports';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-json-imports', () => {
  it('should pass valid non-JSON imports', () => {
    ruleTester.run('no-json-imports', rule, {
      valid: [
        "import { Component } from 'react';",
        "import { Button } from './Button';",
        "import fs from 'fs';",
        "import type { Props } from '../types';",
        "import config from './config.js';",
        "import utils from '../utils/index.ts';",
      ],
      invalid: [],
    });
  });

  it('should report errors for JSON imports', () => {
    ruleTester.run('no-json-imports', rule, {
      valid: [],
      invalid: [
        {
          code: "import config from './config.json';",
          errors: [
            {
              messageId: 'jsonImportNotSupported',
              data: { filename: 'config.json' },
            },
          ],
          output: "const config = JSON.parse(ReadAsciiFile('pkg:/assets/config.json'));",
        },
        {
          code: "import { default as data } from '../assets/data.json';",
          errors: [
            {
              messageId: 'jsonImportNotSupported',
              data: { filename: 'data.json' },
            },
          ],
          output: "const data = JSON.parse(ReadAsciiFile('pkg:/assets/data.json'));",
        },
        {
          code: "import settings from 'settings.json';",
          errors: [
            {
              messageId: 'jsonImportNotSupported',
              data: { filename: 'settings.json' },
            },
          ],
          output: "const settings = JSON.parse(ReadAsciiFile('pkg:/assets/settings.json'));",
        },
      ],
    });
  });

  it('should handle complex JSON import paths', () => {
    ruleTester.run('no-json-imports', rule, {
      valid: [],
      invalid: [
        {
          code: "import translations from '../../../assets/i18n/translations.json';",
          errors: [
            {
              messageId: 'jsonImportNotSupported',
              data: { filename: 'translations.json' },
            },
          ],
          output: "const translations = JSON.parse(ReadAsciiFile('pkg:/assets/translations.json'));",
        },
        {
          code: "import * as config from 'deep/nested/path/config.json';",
          errors: [
            {
              messageId: 'jsonImportNotSupported',
              data: { filename: 'config.json' },
            },
          ],
          output: "const config = JSON.parse(ReadAsciiFile('pkg:/assets/config.json'));",
        },
      ],
    });
  });
});
