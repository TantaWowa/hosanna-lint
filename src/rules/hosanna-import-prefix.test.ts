import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './hosanna-import-prefix';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('hosanna-import-prefix', () => {
  it('should pass valid imports with @hs-src/ prefix', () => {
    ruleTester.run('hosanna-import-prefix', rule, {
      valid: [
        "import { Button } from '@hs-src/hosanna-ui/views/controls/Button';",
        "import { Bridge } from '@hs-src/hosanna-bridge';",
        "import { List } from '@hs-src/hosanna-list/components/List';",
        "import { Component } from 'react';",
        "import fs from 'fs';",
        "import { SomeUtil } from './utils/some-util';",
        "import type { ButtonProps } from '../types/button';",
      ],
      invalid: [],
    });
  });

  it('should report errors and suggest fixes for hosanna imports without @hs-src/ prefix', () => {
    ruleTester.run('hosanna-import-prefix', rule, {
      valid: [],
      invalid: [
        {
          code: "import { Button } from 'hosanna-ui/views/controls/Button';",
          errors: [
            {
              messageId: 'requireHosannaSrcPrefix',
              data: { source: 'hosanna-ui/views/controls/Button' },
            },
          ],
          output: "import { Button } from '@hs-src/hosanna-ui/views/controls/Button';",
        },
        {
          code: "import { Bridge } from 'hosanna-bridge/lib/bridge';",
          errors: [
            {
              messageId: 'requireHosannaSrcPrefix',
              data: { source: 'hosanna-bridge/lib/bridge' },
            },
          ],
          output: "import { Bridge } from '@hs-src/hosanna-bridge/lib/bridge';",
        },
        {
          code: "import { List } from 'hosanna-list';",
          errors: [
            {
              messageId: 'requireHosannaSrcPrefix',
              data: { source: 'hosanna-list' },
            },
          ],
          output: "import { List } from '@hs-src/hosanna-list';",
        },
        {
          code: "import type { HttpTypes } from 'hosanna-bridge-http/types';",
          errors: [
            {
              messageId: 'requireHosannaSrcPrefix',
              data: { source: 'hosanna-bridge-http/types' },
            },
          ],
          output: "import type { HttpTypes } from '@hs-src/hosanna-bridge-http/types';",
        },
      ],
    });
  });

  it('should handle complex import paths correctly', () => {
    ruleTester.run('hosanna-import-prefix', rule, {
      valid: [],
      invalid: [
        {
          code: "import { Target } from 'hosanna-bridge-targets/src/targets/web';",
          errors: [
            {
              messageId: 'requireHosannaSrcPrefix',
              data: { source: 'hosanna-bridge-targets/src/targets/web' },
            },
          ],
          output: "import { Target } from '@hs-src/hosanna-bridge-targets/src/targets/web';",
        },
      ],
    });
  });

  it('should fix relative path imports with hosanna package names', () => {
    ruleTester.run('hosanna-import-prefix', rule, {
      valid: [
        // These should not trigger because they don't contain hosanna packages
        "import { Component } from '../../other/component';",
        "import { Util } from '../shared/utils';",
        "import { Helper } from './local/helper';",
      ],
      invalid: [
        // Relative paths that contain hosanna package names should be fixed
        {
          code: "import { Button } from '../../hosanna-ui/views/Button';",
          errors: [
            {
              messageId: 'requireHosannaSrcPrefix',
              data: { source: '../../hosanna-ui/views/Button' },
            },
          ],
          output: "import { Button } from '@hs-src/hosanna-ui/views/Button';",
        },
        {
          code: "import { Bridge } from '../hosanna-bridge/lib/core';",
          errors: [
            {
              messageId: 'requireHosannaSrcPrefix',
              data: { source: '../hosanna-bridge/lib/core' },
            },
          ],
          output: "import { Bridge } from '@hs-src/hosanna-bridge/lib/core';",
        },
        {
          code: "import { List } from '../../../hosanna-list/components/List';",
          errors: [
            {
              messageId: 'requireHosannaSrcPrefix',
              data: { source: '../../../hosanna-list/components/List' },
            },
          ],
          output: "import { List } from '@hs-src/hosanna-list/components/List';",
        },
        {
          code: "import type { HttpClient } from '../../hosanna-bridge-http/client';",
          errors: [
            {
              messageId: 'requireHosannaSrcPrefix',
              data: { source: '../../hosanna-bridge-http/client' },
            },
          ],
          output: "import type { HttpClient } from '@hs-src/hosanna-bridge-http/client';",
        },
        {
          code: "import { Targets } from '../hosanna-bridge-targets/src/index';",
          errors: [
            {
              messageId: 'requireHosannaSrcPrefix',
              data: { source: '../hosanna-bridge-targets/src/index' },
            },
          ],
          output: "import { Targets } from '@hs-src/hosanna-bridge-targets/src/index';",
        },
      ],
    });
  });
});
