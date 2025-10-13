import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-hosanna-generated-imports';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-hosanna-generated-imports', () => {
  it('should pass valid imports', () => {
    ruleTester.run('no-hosanna-generated-imports', rule, {
      valid: [
        "import { Button } from '@hs-src/hosanna-ui/views/controls/Button';",
        "import { Component } from 'react';",
        "import fs from 'fs';",
        "import { SomeUtil } from './utils/some-util';",
        "import type { ButtonProps } from '../types/button';",
        "import { AsyncUtil } from '@hs-generated-async';",
      ],
      invalid: [],
    });
  });

  it('should report errors for generated imports', () => {
    ruleTester.run('no-hosanna-generated-imports', rule, {
      valid: [],
      invalid: [
        {
          code: "import { ButtonViewStruct } from '@hs-generated/hosanna-ui/views/controls/Button/Button-generated-struct';",
          errors: [
            {
              messageId: 'noGeneratedImports',
            },
          ],
        },
        {
          code: "import { SomeStruct } from './my-generated-struct-file';",
          errors: [
            {
              messageId: 'noGeneratedImports',
            },
          ],
        },
        {
          code: "import type { GeneratedType } from '@hs-generated/types/generated-types';",
          errors: [
            {
              messageId: 'noGeneratedImports',
            },
          ],
        },
      ],
    });
  });
});
