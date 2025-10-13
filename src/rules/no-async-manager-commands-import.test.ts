import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-async-manager-commands-import';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-async-manager-commands-import', () => {
  it('should pass valid imports', () => {
    ruleTester.run('no-async-manager-commands-import', rule, {
      valid: [
        // The allowed import
        "import { AsyncManagerCommands } from '@hs-generated-async/AsyncManagerCommands';",
        "import * as Commands from '@hs-generated-async/AsyncManagerCommands';",
        "import type { AsyncManagerCommands } from '@hs-generated-async/AsyncManagerCommands';",

        // Imports that don't contain AsyncManagerCommands
        "import { Button } from '@hs-src/hosanna-ui/views/controls/Button';",
        "import { Component } from 'react';",
        "import fs from 'fs';",
        "import { SomeUtil } from './utils/some-util';",
        "import type { ButtonProps } from '../types/button';",
        "import { AsyncUtil } from '@hs-generated-async/AysyncManager';",
      ],
      invalid: [],
    });
  });

  it('should report errors for invalid AsyncManagerCommands imports', () => {
    ruleTester.run('no-async-manager-commands-import', rule, {
      valid: [],
      invalid: [
        {
          code: "import { AsyncManagerCommands } from './local/AsyncManagerCommands';",
          errors: [
            {
              messageId: 'asyncManagerCommandsWrongImport',
              data: { source: './local/AsyncManagerCommands' },
            },
          ],
          output: "import { AsyncManagerCommands } from '@hs-generated-async/AsyncManagerCommands';",
        },
        {
          code: "import * as Commands from '../utils/AsyncManagerCommands';",
          errors: [
            {
              messageId: 'asyncManagerCommandsWrongImport',
              data: { source: '../utils/AsyncManagerCommands' },
            },
          ],
          output: "import * as Commands from '@hs-generated-async/AsyncManagerCommands';",
        },
        {
          code: "import type { AsyncManagerCommands } from '@hs-generated/other/AsyncManagerCommands';",
          errors: [
            {
              messageId: 'asyncManagerCommandsWrongImport',
              data: { source: '@hs-generated/other/AsyncManagerCommands' },
            },
          ],
          output: "import type { AsyncManagerCommands } from '@hs-generated-async/AsyncManagerCommands';",
        },
        {
          code: "import { Commands } from 'some-package/AsyncManagerCommands/utils';",
          errors: [
            {
              messageId: 'asyncManagerCommandsWrongImport',
              data: { source: 'some-package/AsyncManagerCommands/utils' },
            },
          ],
          output: "import { Commands } from '@hs-generated-async/AsyncManagerCommands';",
        },
      ],
    });
  });

  it('should handle various import patterns correctly', () => {
    ruleTester.run('no-async-manager-commands-import', rule, {
      valid: [
        // Default imports from allowed path
        "import AsyncManagerCommands from '@hs-generated-async/AsyncManagerCommands';",
        // Re-exports from allowed path
        "export { AsyncManagerCommands } from '@hs-generated-async/AsyncManagerCommands';",
        "export * from '@hs-generated-async/AsyncManagerCommands';",
      ],
      invalid: [
        {
          code: `
            import React from 'react';
            import { AsyncManagerCommands } from './AsyncManagerCommands';
            import utils from './utils';
          `,
          errors: [
            {
              messageId: 'asyncManagerCommandsWrongImport',
              data: { source: './AsyncManagerCommands' },
            },
          ],
          output: `
            import React from 'react';
            import { AsyncManagerCommands } from '@hs-generated-async/AsyncManagerCommands';
            import utils from './utils';
          `,
        },
      ],
    });
  });
});
