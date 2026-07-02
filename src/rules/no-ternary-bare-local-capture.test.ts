import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-ternary-bare-local-capture';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-ternary-bare-local-capture', () => {
  it('allows shapes that never lowered to an uncaptured-identifier IIFE', () => {
    ruleTester.run('no-ternary-bare-local-capture', rule, {
      valid: [
        // Direct assignment to an identifier lowers to inline if/else — no IIFE
        'function f(a: string | undefined) { const x = a ? a : getDefault(); }',
        'function f(a: string | undefined) { let x; x = a ? a : getDefault(); }',
        // Fast path (hs_ternary): no calls in branches, no risky test reference
        'function f(cond: boolean, a: string, b: string) { doThing(cond ? a : b); }',
        // Test identifiers are evaluated at the call site (__hsCondition) — a call in the
        // test alone does not force the IIFE
        'function f(a: string, b: string) { doThing(check() ? a : b); }',
        // this-branches are captured via `m`
        'class C { fallback = ""; f(cond: boolean) { return { v: cond ? this.fallback : getDefault() }; } }',
        // Member-expression branches are descendants — always collected
        'function f(cond: boolean, obj: { v: string }) { return { v: cond ? obj.v : getDefault() }; }',
        // Equality test against a literal: only the variable side is risky, and the
        // branches do not reference it
        'function f(status: number, a: string, b: string) { doThing(status === 1 ? a : b); }',
        // Equality test against an enum-like constant: constant side is exempt, branch
        // may share identifier names with the enum without forcing the IIFE
        'function f(viewStatus: number, a: string, b: string) { doThing(viewStatus === ViewStatus.Focused ? a : b); }',
        // Unresolved globals were never capture candidates
        'doThing(check() ? window : getDefault());',
        // No calls and both risky-test-referencing branches are bare: pre-fix their names
        // were never collected, so no trigger fired — these lowered to hs_ternary (safe)
        'function f(logoImage: string | undefined, path: string) { doThing(logoImage ? logoImage : path); }',
        'function f(count: number) { doThing(count !== 0 ? count : 1); }',
        'function f(value: unknown, fallback: number) { doThing(typeof value === "number" ? value : fallback); }',
      ],
      invalid: [],
    });
  });

  it('flags bare local branches in IIFE-lowered positions (the pre-1.29.0 device crash)', () => {
    ruleTester.run('no-ternary-bare-local-capture', rule, {
      valid: [],
      invalid: [
        {
          // Call in the alternate → IIFE; bare local consequent is uncaptured
          code: 'function f(cond: boolean, value: string) { return { v: cond ? value : getDefault() }; }',
          errors: [{ messageId: 'bareLocalTernaryCapture', data: { name: 'value' } }],
        },
        {
          // Call in the consequent → IIFE; bare local alternate is uncaptured
          code: 'function f(cond: boolean, fallback: string) { doThing(cond ? compute() : fallback); }',
          errors: [{ messageId: 'bareLocalTernaryCapture', data: { name: 'fallback' } }],
        },
        {
          // The other (non-bare) branch references the test identifier → IIFE without
          // calls, and the bare branch is uncaptured
          code: 'function f(logoImage: string | undefined, path: string, fallback: string) { doThing(logoImage ? path + logoImage : fallback); }',
          errors: [{ messageId: 'bareLocalTernaryCapture', data: { name: 'fallback' } }],
        },
        {
          // Result consumed by a member access is not the optimized assignment context
          code: 'function f(cond: boolean, foo: { p: number }) { const x = (cond ? foo : makeDefault()).p; }',
          errors: [{ messageId: 'bareLocalTernaryCapture', data: { name: 'foo' } }],
        },
        {
          // A call inside a branch triggers the IIFE even when its argument is a local
          code: 'function f(cond: boolean, a: number, b: number) { doThing(cond ? a : pick(b)); }',
          errors: [{ messageId: 'bareLocalTernaryCapture', data: { name: 'a' } }],
        },
      ],
    });
  });
});
