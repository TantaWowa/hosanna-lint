import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-top-level-runtime-in-no-module';
import { wrapRuleWithHsDisable } from '../utils/hs-disable';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-top-level-runtime-in-no-module', () => {
  it('reports top-level runtime statements in hs:no-module files', () => {
    ruleTester.run('no-top-level-runtime-in-no-module', rule, {
      valid: [
        `
          // hs:no-module
          import { thing } from './thing';
          interface Options { name: string }
          type Count = number;
          function main() {
            const width = 1920;
            return width;
          }
          class Screen {}
        `,
        `
          function main() {}
          const width = 1920;
        `,
        `
          // hs:no-module
          hs_native_roku(\`
            function onKeyEvent(key as string, pressed as boolean) as boolean
              return true
            end function
          \`);
        `,
      ],
      invalid: [
        {
          code: `
            // hs:no-module
            const ROKU_GAME_SCREEN_WIDTH = 1920;
            function main() {}
          `,
          errors: [{ messageId: 'topLevelRuntimeInNoModule' }],
        },
        {
          code: `
            // hs:no-module
            setup();
            function main() {}
          `,
          errors: [{ messageId: 'topLevelRuntimeInNoModule' }],
        },
        {
          code: `
            // hs:no-module
            if (DEV) {
              setup();
            }
            function main() {}
          `,
          errors: [{ messageId: 'topLevelRuntimeInNoModule' }],
        },
      ],
    });
  });

  it('suppresses with hs:disable-next-line HS-1133', () => {
    const wrapped = wrapRuleWithHsDisable(rule, 'no-top-level-runtime-in-no-module');
    ruleTester.run('no-top-level-runtime-in-no-module', wrapped, {
      valid: [
        `
          // hs:no-module
          // hs:disable-next-line HS-1133
          const width = 1920;
        `,
      ],
      invalid: [],
    });
  });
});
