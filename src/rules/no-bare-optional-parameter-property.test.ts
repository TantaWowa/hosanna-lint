import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-bare-optional-parameter-property';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-bare-optional-parameter-property', () => {
  it('allows required parameter properties, explicit defaults, and plain bare-optional params', () => {
    ruleTester.run('no-bare-optional-parameter-property', rule, {
      valid: [
        // Required parameter property
        'class Resolver { constructor(private config: { name: string }) {} }',
        // Parameter property with explicit default
        'class Resolver { constructor(private config: { name: string } | undefined = undefined) {} }',
        'class Resolver { constructor(private count: number = 0) {} }',
        // Plain bare-optional params always emitted "= invalid" correctly — never flagged
        'function load(config?: { name: string }) {}',
        'class Resolver { init(config?: { name: string }) {} }',
        'class Resolver { constructor(config?: { name: string }) {} }',
        'const f = (config?: { name: string }) => {};',
      ],
      invalid: [],
    });
  });

  it('flags bare-optional parameter properties (pre-1.29.0 arity crash) and suggests a default', () => {
    ruleTester.run('no-bare-optional-parameter-property', rule, {
      valid: [],
      invalid: [
        {
          // The original device repro
          code: 'class Resolver { constructor(private config?: { name: string }) {} }',
          errors: [
            {
              messageId: 'bareOptionalParameterProperty',
              data: { name: 'config' },
              suggestions: [
                {
                  messageId: 'addExplicitUndefinedDefault',
                  output: 'class Resolver { constructor(private config: { name: string } | undefined = undefined) {} }',
                },
              ],
            },
          ],
        },
        {
          // readonly + accessibility modifiers preserved (they sit outside the parameter node)
          code: 'class C { constructor(public readonly name?: string) {} }',
          errors: [
            {
              messageId: 'bareOptionalParameterProperty',
              data: { name: 'name' },
              suggestions: [
                {
                  messageId: 'addExplicitUndefinedDefault',
                  output: 'class C { constructor(public readonly name: string | undefined = undefined) {} }',
                },
              ],
            },
          ],
        },
        {
          // Function types must be parenthesized in the union
          code: 'class C { constructor(private cb?: () => void) {} }',
          errors: [
            {
              messageId: 'bareOptionalParameterProperty',
              data: { name: 'cb' },
              suggestions: [
                {
                  messageId: 'addExplicitUndefinedDefault',
                  output: 'class C { constructor(private cb: (() => void) | undefined = undefined) {} }',
                },
              ],
            },
          ],
        },
        {
          // Annotation already includes undefined — no double union
          code: 'class C { constructor(private v?: string | undefined) {} }',
          errors: [
            {
              messageId: 'bareOptionalParameterProperty',
              data: { name: 'v' },
              suggestions: [
                {
                  messageId: 'addExplicitUndefinedDefault',
                  output: 'class C { constructor(private v: string | undefined = undefined) {} }',
                },
              ],
            },
          ],
        },
        {
          // No type annotation
          code: 'class C { constructor(private x?) {} }',
          errors: [
            {
              messageId: 'bareOptionalParameterProperty',
              data: { name: 'x' },
              suggestions: [
                {
                  messageId: 'addExplicitUndefinedDefault',
                  output: 'class C { constructor(private x = undefined) {} }',
                },
              ],
            },
          ],
        },
      ],
    });
  });
});
