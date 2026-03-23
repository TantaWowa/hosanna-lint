import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import noInfinityUsage from '../rules/no-infinity-usage';
import noTernaryIifeSlowPath from '../rules/no-ternary-iife-slow-path';
import { wrapRuleWithHsDisable } from './hs-disable';

const wrappedRule = wrapRuleWithHsDisable(noInfinityUsage, 'no-infinity-usage');
const wrappedTernaryRule = wrapRuleWithHsDisable(noTernaryIifeSlowPath, 'no-ternary-iife-slow-path');

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('hs:disable directive support', () => {
  it('should suppress with hs:disable-next-line using HS code', () => {
    ruleTester.run('no-infinity-usage', wrappedRule, {
      valid: [
        {
          code: `// hs:disable-next-line HS-1038\nconst x = Infinity;`,
        },
      ],
      invalid: [],
    });
  });

  it('should suppress with hs:disable-next-line using lowercase HS code', () => {
    ruleTester.run('no-infinity-usage', wrappedRule, {
      valid: [
        {
          code: `// hs:disable-next-line hs-1038\nconst x = Infinity;`,
        },
      ],
      invalid: [],
    });
  });

  it('should suppress with hs:disable-next-line using rule name', () => {
    ruleTester.run('no-infinity-usage', wrappedRule, {
      valid: [
        {
          code: `// hs:disable-next-line no-infinity-usage\nconst x = Infinity;`,
        },
      ],
      invalid: [],
    });
  });

  it('should suppress with hs:disable-next-line (no specific code = suppress all)', () => {
    ruleTester.run('no-infinity-usage', wrappedRule, {
      valid: [
        {
          code: `// hs:disable-next-line\nconst x = Infinity;`,
        },
      ],
      invalid: [],
    });
  });

  it('should suppress with hs:ignore', () => {
    ruleTester.run('no-infinity-usage', wrappedRule, {
      valid: [
        {
          code: `// hs:ignore\nconst x = Infinity;`,
        },
      ],
      invalid: [],
    });
  });

  it('should suppress with file-level block disable', () => {
    ruleTester.run('no-infinity-usage', wrappedRule, {
      valid: [
        {
          code: `/* hs:disable HS-1038 */\nconst x = Infinity;`,
        },
      ],
      invalid: [],
    });
  });

  it('should suppress with file-level block disable using rule name', () => {
    ruleTester.run('no-infinity-usage', wrappedRule, {
      valid: [
        {
          code: `/* hs:disable no-infinity-usage */\nconst x = Infinity;`,
        },
      ],
      invalid: [],
    });
  });

  it('should suppress with file-level block disable with multiple codes', () => {
    ruleTester.run('no-infinity-usage', wrappedRule, {
      valid: [
        {
          code: `/* hs:disable HS-1019, HS-1038, HS-1105 */\nconst x = Infinity;`,
        },
      ],
      invalid: [],
    });
  });

  it('should NOT suppress when hs:disable-next-line has a different code', () => {
    ruleTester.run('no-infinity-usage', wrappedRule, {
      valid: [],
      invalid: [
        {
          code: `// hs:disable-next-line HS-1019\nconst x = Infinity;`,
          errors: [{ messageId: 'infinityNotSupported' }],
        },
      ],
    });
  });

  it('should NOT suppress when hs:disable-next-line is two lines above', () => {
    ruleTester.run('no-infinity-usage', wrappedRule, {
      valid: [],
      invalid: [
        {
          code: `// hs:disable-next-line HS-1038\nconst y = 1;\nconst x = Infinity;`,
          errors: [{ messageId: 'infinityNotSupported' }],
        },
      ],
    });
  });

  it('should still report when no hs:disable comment is present', () => {
    ruleTester.run('no-infinity-usage', wrappedRule, {
      valid: [],
      invalid: [
        {
          code: `const x = Infinity;`,
          errors: [{ messageId: 'infinityNotSupported' }],
        },
      ],
    });
  });

  it('should suppress no-ternary-iife-slow-path with hs:disable-next-line hs-1112', () => {
    ruleTester.run('no-ternary-iife-slow-path', wrappedTernaryRule, {
      valid: [
        {
          code: `// hs:disable-next-line hs-1112\nconst x = a ? a + 1 : 0;`,
        },
      ],
      invalid: [],
    });
  });

  it('should suppress no-ternary-iife-slow-path with hs:disable-next-line no-ternary-iife-slow-path', () => {
    ruleTester.run('no-ternary-iife-slow-path', wrappedTernaryRule, {
      valid: [
        {
          code: `// hs:disable-next-line no-ternary-iife-slow-path\nconst x = a ? a + 1 : 0;`,
        },
      ],
      invalid: [],
    });
  });

  it('should suppress entire file when hs:exclude-from-platform roku is in comment-only prefix (transpiler parity)', () => {
    ruleTester.run('no-infinity-usage', wrappedRule, {
      valid: [
        {
          code: `// hs:no-module
// hs:exclude-from-platform roku
const x = Infinity;`,
        },
        {
          code: `/*
 * hs:exclude-from-platform roku
 */
const x = Infinity;`,
        },
      ],
      invalid: [],
    });
  });

  it('should NOT suppress file for hs:exclude-from-platform web', () => {
    ruleTester.run('no-infinity-usage', wrappedRule, {
      valid: [],
      invalid: [
        {
          code: `// hs:exclude-from-platform web
const x = Infinity;`,
          errors: [{ messageId: 'infinityNotSupported' }],
        },
      ],
    });
  });

  it('should suppress statement when // hs:exclude-from-platform roku is on the previous line', () => {
    ruleTester.run('no-infinity-usage', wrappedRule, {
      valid: [
        {
          code: `const y = 1;
// hs:exclude-from-platform roku
const x = Infinity;`,
        },
      ],
      invalid: [],
    });
  });
});
