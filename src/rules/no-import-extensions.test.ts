import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-import-extensions';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-import-extensions', () => {
  it('should pass valid imports without extensions', () => {
    ruleTester.run('no-import-extensions', rule, {
      valid: [
        "import { foo } from 'bar';",
        "import * as baz from 'baz/qux';",
        "import def from 'def';",
        "import 'side-effect';",
        "import { foo } from './relative/path';",
        "import { foo } from '../parent/path';",
        "import { foo } from '@scoped/package';",
        "import jsonData from './data.json';", // JSON imports are OK
        "import pkg from 'some-package';",
        "import { Component } from 'react';",
      ],
      invalid: [],
    });
  });

  it('should report errors for imports with .js or .ts extensions', () => {
    ruleTester.run('no-import-extensions', rule, {
      valid: [],
      invalid: [
        {
          code: "import { foo } from 'bar.js';",
          errors: [
            {
              messageId: 'importPathExtensionNotAllowed',
              data: { path: 'bar.js' },
            },
          ],
          output: "import { foo } from 'bar';",
        },
        {
          code: "import * as baz from 'baz/qux.js';",
          errors: [
            {
              messageId: 'importPathExtensionNotAllowed',
              data: { path: 'baz/qux.js' },
            },
          ],
          output: "import * as baz from 'baz/qux';",
        },
        {
          code: "import def from './utils/def.ts';",
          errors: [
            {
              messageId: 'importPathExtensionNotAllowed',
              data: { path: './utils/def.ts' },
            },
          ],
          output: "import def from './utils/def';",
        },
        {
          code: "import 'side-effect.ts';",
          errors: [
            {
              messageId: 'importPathExtensionNotAllowed',
              data: { path: 'side-effect.ts' },
            },
          ],
          output: "import 'side-effect';",
        },
        {
          code: "import { Component } from './components/Button.js';",
          errors: [
            {
              messageId: 'importPathExtensionNotAllowed',
              data: { path: './components/Button.js' },
            },
          ],
          output: "import { Component } from './components/Button';",
        },
        {
          code: "import helper from '../helpers/utility.ts';",
          errors: [
            {
              messageId: 'importPathExtensionNotAllowed',
              data: { path: '../helpers/utility.ts' },
            },
          ],
          output: "import helper from '../helpers/utility';",
        },
      ],
    });
  });

  it('should handle various import patterns correctly', () => {
    ruleTester.run('no-import-extensions', rule, {
      valid: [
        // Type-only imports
        "import type { Foo } from 'bar';",
        "import type * as Baz from 'baz';",

        // Dynamic imports
        "const module = await import('module');",

        // Re-exports
        "export { foo } from 'bar';",
        "export * from 'baz';",
      ],
      invalid: [
        {
          code: `
            import React from 'react.js';
            import { useState } from 'react';
            import utils from './utils.ts';
          `,
          errors: [
            {
              messageId: 'importPathExtensionNotAllowed',
              data: { path: 'react.js' },
            },
            {
              messageId: 'importPathExtensionNotAllowed',
              data: { path: './utils.ts' },
            },
          ],
          output: `
            import React from 'react';
            import { useState } from 'react';
            import utils from './utils';
          `,
        },
      ],
    });
  });
});
