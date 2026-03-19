import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-native-function-closure-or-variadic-invocation';
import { wrapRuleWithHsDisable } from '../utils/hs-disable';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-native-function-closure-or-variadic-invocation', () => {
  it('reports when CreateObject is invoked through closure (assigned to variable)', () => {
    ruleTester.run('no-native-function-closure-or-variadic-invocation', rule, {
      valid: [],
      invalid: [
        {
          code: `
            declare function CreateObject<T>(t: string, type?: string): T;
            const create = CreateObject;
            const node = create('roSGNode', 'Node');
          `,
          errors: [
            {
              messageId: 'nativeFunctionClosureOrVariadicInvocation',
              data: { functionName: 'CreateObject' },
            },
          ],
        },
      ],
    });
  });

  it('reports when CreateObject is invoked with spread', () => {
    ruleTester.run('no-native-function-closure-or-variadic-invocation', rule, {
      valid: [],
      invalid: [
        {
          code: `
            declare function CreateObject<T>(t: string, type?: string): T;
            const args = ['roSGNode', 'Node'];
            const node = CreateObject(...args);
          `,
          errors: [
            {
              messageId: 'nativeFunctionClosureOrVariadicInvocation',
              data: { functionName: 'CreateObject' },
            },
          ],
        },
      ],
    });
  });

  it('does not flag direct CreateObject call without spread', () => {
    ruleTester.run('no-native-function-closure-or-variadic-invocation', rule, {
      valid: [
        `
          declare function CreateObject<T>(t: string, type?: string): T;
          const node = CreateObject('roSGNode', 'Node');
        `,
      ],
      invalid: [],
    });
  });

  it('suppresses with hs:disable-next-line hs-1115', () => {
    const wrappedRule = wrapRuleWithHsDisable(rule, 'no-native-function-closure-or-variadic-invocation');
    ruleTester.run('no-native-function-closure-or-variadic-invocation', wrappedRule, {
      valid: [
        `
          declare function CreateObject<T>(t: string, type?: string): T;
          // hs:disable-next-line hs-1115
          const create = CreateObject;
          const node = create('roSGNode', 'Node');
        `,
      ],
      invalid: [],
    });
  });

  it('suppresses with hs:disable-next-line no-native-function-closure-or-variadic-invocation', () => {
    const wrappedRule = wrapRuleWithHsDisable(rule, 'no-native-function-closure-or-variadic-invocation');
    ruleTester.run('no-native-function-closure-or-variadic-invocation', wrappedRule, {
      valid: [
        `
          declare function CreateObject<T>(t: string, type?: string): T;
          // hs:disable-next-line no-native-function-closure-or-variadic-invocation
          const create = CreateObject;
          const node = create('roSGNode', 'Node');
        `,
      ],
      invalid: [],
    });
  });
});
