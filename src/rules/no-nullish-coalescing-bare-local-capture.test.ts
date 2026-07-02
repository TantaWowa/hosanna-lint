import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-nullish-coalescing-bare-local-capture';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-nullish-coalescing-bare-local-capture', () => {
  it('allows shapes that never lowered to an uncaptured-identifier IIFE', () => {
    ruleTester.run('no-nullish-coalescing-bare-local-capture', rule, {
      valid: [
        // Direct assignment to an identifier lowers to inline if/else — no IIFE
        'const foo = getFoo(); const x = foo ?? getDefault();',
        'const foo = getFoo(); let x; x = foo ?? getDefault();',
        'const foo = getFoo(); let x = 0; x += foo ?? getDefault();',
        // Fast path (hs_coalesce): no calls in either operand, right does not reference left
        'function f(foo: string | undefined) { return { a: foo ?? "fallback" }; }',
        'function f(foo: number | undefined, bar: number) { doThing(foo ?? bar); }',
        // this-captures are safe — `m` is always passed to the IIFE
        'class C { foo?: string; f() { return { a: this.foo ?? getDefault() }; } }',
        // Member-expression operands are descendants of the operand path — always collected
        'function f(obj: { foo?: string }) { return { a: obj.foo ?? getDefault() }; }',
        'function f(response: any) { doThing(response?.status ?? getDefault()); }',
        // Call-expression operands are not bare identifiers
        'function f() { return { a: getFoo() ?? "x" }; }',
        // Unresolved globals were never capture candidates
        'doThing(window ?? getDefault());',
      ],
      invalid: [],
    });
  });

  it('flags bare locals in IIFE-lowered positions (the pre-1.29.0 device crash)', () => {
    ruleTester.run('no-nullish-coalescing-bare-local-capture', rule, {
      valid: [],
      invalid: [
        {
          // The original on-device repro: object-literal property value with a call fallback
          code: 'function build(skyClearColor: any) { return { clearColor: skyClearColor ?? fallbackColor() }; }',
          errors: [{ messageId: 'bareLocalNullishCapture', data: { name: 'skyClearColor' } }],
        },
        {
          // Call-argument position
          code: 'function f(foo: string | undefined) { doThing(foo ?? getDefault()); }',
          errors: [{ messageId: 'bareLocalNullishCapture', data: { name: 'foo' } }],
        },
        {
          // Return position
          code: 'function f(foo: string | undefined) { return foo ?? getDefault(); }',
          errors: [{ messageId: 'bareLocalNullishCapture', data: { name: 'foo' } }],
        },
        {
          // Bare identifier on the RIGHT is equally uncaptured when the left has a call
          code: 'function f(fallback: string) { return { a: getThing() ?? fallback }; }',
          errors: [{ messageId: 'bareLocalNullishCapture', data: { name: 'fallback' } }],
        },
        {
          // Right references left → IIFE even without calls
          code: 'function f(a: number | undefined) { doThing(a ?? a + 1); }',
          errors: [{ messageId: 'bareLocalNullishCapture', data: { name: 'a' } }],
        },
        {
          // Result is consumed by a member access, not assigned to an identifier — still IIFE
          code: 'function f(foo: { p: number } | undefined) { const x = (foo ?? makeDefault()).p; }',
          errors: [{ messageId: 'bareLocalNullishCapture', data: { name: 'foo' } }],
        },
        {
          // Destructuring declarator is not the optimized assignment context
          code: 'function f(foo: string | undefined) { const { a } = { a: foo ?? getDefault() }; }',
          errors: [{ messageId: 'bareLocalNullishCapture', data: { name: 'foo' } }],
        },
        {
          // Both operands bare with right-refs-left: both are flagged
          code: 'function f(a: number | undefined) { doThing(a ?? a); }',
          errors: [
            { messageId: 'bareLocalNullishCapture', data: { name: 'a' } },
            { messageId: 'bareLocalNullishCapture', data: { name: 'a' } },
          ],
        },
      ],
    });
  });
});
