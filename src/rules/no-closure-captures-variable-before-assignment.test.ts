import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-closure-captures-variable-before-assignment';
import { wrapRuleWithHsDisable } from '../utils/hs-disable';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-closure-captures-variable-before-assignment', () => {
  it('reports when closure captures variable assigned from enclosing expression (setTimeout pattern)', () => {
    ruleTester.run('no-closure-captures-variable-before-assignment', rule, {
      valid: [],
      invalid: [
        {
          code: `
            const timerId = setTimeout(() => clearTimeout(timerId), 400);
          `,
          errors: [
            {
              messageId: 'closureCapturesVariableBeforeAssignment',
            },
          ],
        },
      ],
    });
  });

  it('reports when closure captures variable from register-style API', () => {
    ruleTester.run('no-closure-captures-variable-before-assignment', rule, {
      valid: [],
      invalid: [
        {
          code: `
            const id = register(() => unregister(id));
          `,
          errors: [
            {
              messageId: 'closureCapturesVariableBeforeAssignment',
            },
          ],
        },
      ],
    });
  });

  it('reports when closure captures variable from createHandler-style API', () => {
    ruleTester.run('no-closure-captures-variable-before-assignment', rule, {
      valid: [],
      invalid: [
        {
          code: `
            const handle = createHandler(() => dispose(handle));
          `,
          errors: [
            {
              messageId: 'closureCapturesVariableBeforeAssignment',
            },
          ],
        },
      ],
    });
  });

  it('does not flag object pattern (ref.id)', () => {
    ruleTester.run('no-closure-captures-variable-before-assignment', rule, {
      valid: [
        `
          const ref: { id?: number } = {};
          ref.id = setTimeout(() => clearTimeout(ref.id!), 400);
        `,
      ],
      invalid: [],
    });
  });

  it('does not flag when variable is assigned before closure', () => {
    ruleTester.run('no-closure-captures-variable-before-assignment', rule, {
      valid: [
        'let result = 42; const getter = () => result;',
        `
          const x = fn();
          const cb = () => use(x);
        `,
      ],
      invalid: [],
    });
  });

  it('does not flag var declarations (hoisted)', () => {
    ruleTester.run('no-closure-captures-variable-before-assignment', rule, {
      valid: [
        'var timerId = setTimeout(() => clearTimeout(timerId), 400);',
      ],
      invalid: [],
    });
  });

  it('flags nested closures that capture the variable', () => {
    ruleTester.run('no-closure-captures-variable-before-assignment', rule, {
      valid: [],
      invalid: [
        {
          code: `
            const id = register(() => other(() => unregister(id)));
          `,
          errors: [
            {
              messageId: 'closureCapturesVariableBeforeAssignment',
            },
          ],
        },
      ],
    });
  });

  it('suppresses with hs:disable-next-line hs-1116', () => {
    const wrappedRule = wrapRuleWithHsDisable(rule, 'no-closure-captures-variable-before-assignment');
    ruleTester.run('no-closure-captures-variable-before-assignment', wrappedRule, {
      valid: [
        '// hs:disable-next-line hs-1116\nconst timerId = setTimeout(() => clearTimeout(timerId), 400);',
      ],
      invalid: [],
    });
  });
});
