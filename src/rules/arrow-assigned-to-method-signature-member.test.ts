import { describe, expect, it } from 'vitest';
import { Rule, RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import { join } from 'path';
import rule from './arrow-assigned-to-method-signature-member';
import { wrapRuleWithHsDisable } from '../utils/hs-disable';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
    parserOptions: {
      projectService: true,
      tsconfigRootDir: join(__dirname, '../..'),
    },
  },
});

describe('arrow-assigned-to-method-signature-member', () => {
  it('skips object literals with no function-like property values before requesting the checker', () => {
    let getTypeCheckerCalls = 0;
    const listener = rule.create({
      sourceCode: {
        parserServices: {
          program: {
            getTypeChecker() {
              getTypeCheckerCalls += 1;
              throw new Error('checker should not be requested');
            },
          },
          esTreeNodeToTSNodeMap: {
            get() {
              throw new Error('TS node map should not be requested');
            },
          },
        },
      },
      report() {
        throw new Error('should not report');
      },
    } as unknown as Parameters<typeof rule.create>[0]);

    listener.ObjectExpression?.({
      type: 'ObjectExpression',
      properties: [
        {
          type: 'Property',
          key: { type: 'Identifier', name: 'value' },
          value: { type: 'Literal', value: 1 },
          computed: false,
          method: false,
          shorthand: false,
        },
      ],
    } as unknown as Rule.Node);

    expect(getTypeCheckerCalls).toBe(0);
  });

  it('flags HS-1128 for arrow assigned to a method-signature member (inline contextual type)', () => {
    ruleTester.run('arrow-assigned-to-method-signature-member', rule, {
      valid: [],
      invalid: [
        {
          code: `function createDeps(): { make(): string } { return { make: () => 'hello' }; }`,
          errors: [{ messageId: 'arrowAssignedToMethodSignatureMember' }],
        },
      ],
    });
  });

  it('flags HS-1128 for an interface method signature backed by an arrow (FileTaskManager shape)', () => {
    ruleTester.run('arrow-assigned-to-method-signature-member', rule, {
      valid: [],
      invalid: [
        {
          code: `
            interface Deps { fsName(path: string): string; }
            function createDeps(): Deps { return { fsName: (path: string) => 'fs:' + path }; }
          `,
          errors: [{ messageId: 'arrowAssignedToMethodSignatureMember' }],
        },
      ],
    });
  });

  it('does NOT flag the safe patterns (property-of-function-type, untyped, method shorthand, class method, fn declaration)', () => {
    ruleTester.run('arrow-assigned-to-method-signature-member', rule, {
      valid: [
        // Property-of-function-type member — the recommended fix shape (call sites emit .call).
        `const x: { make: () => string } = { make: () => 'hi' };`,
        // Untyped object literal — inferred property of function type, no contextual MethodSignature.
        `const y = { make: () => 'hi' };`,
        // Method shorthand — emits a raw function, not the bug.
        `function f(): { make(): string } { return { make() { return 'hi'; } }; }`,
        // Interface method backed by a class instance — raw function via class method, not the bug.
        `
          interface IGreeter { greet(name: string): string; }
          class Greeter implements IGreeter {
            greet(name: string): string { return 'hi ' + name; }
          }
          function makeGreeter(): IGreeter { return new Greeter(); }
        `,
        // Identifier resolving to a module-level FUNCTION DECLARATION (raw function, works).
        `
          interface Deps { make(): string; }
          function makeImpl(): string { return 'hi'; }
          function createDeps(): Deps { return { make: makeImpl }; }
        `,
      ],
      invalid: [],
    });
  });

  // Copilot review (PR #9, #206 — parity with transpiler): the rule flags BOTH
  // ArrowFunctionExpression and FunctionExpression. Lock in the function-expression branch.
  it('flags HS-1128 when the value is a function expression (not an arrow)', () => {
    ruleTester.run('arrow-assigned-to-method-signature-member', rule, {
      valid: [],
      invalid: [
        {
          code: `function createDeps(): { make(): string } { return { make: function () { return 'hi'; } }; }`,
          errors: [{ messageId: 'arrowAssignedToMethodSignatureMember' }],
        },
      ],
    });
  });

  // Copilot review (#206 c1 — parity): identifier-backed property value resolving to a local
  // arrow `const` declaration. Same closure-object value, same crash.
  it('flags HS-1128 when the value is an identifier resolving to a local arrow const', () => {
    ruleTester.run('arrow-assigned-to-method-signature-member', rule, {
      valid: [],
      invalid: [
        {
          code: `
            interface Deps { make(): string; }
            function createDeps(): Deps {
              const makeImpl = () => 'hi';
              return { make: makeImpl };
            }
          `,
          errors: [{ messageId: 'arrowAssignedToMethodSignatureMember' }],
        },
      ],
    });
  });

  // Copilot review (#206 c1 — parity): shorthand `{ make }` where `make` is a local arrow const.
  it('flags HS-1128 for shorthand property whose name resolves to a local arrow const', () => {
    ruleTester.run('arrow-assigned-to-method-signature-member', rule, {
      valid: [],
      invalid: [
        {
          code: `
            interface Deps { make(): string; }
            function createDeps(): Deps {
              const make = () => 'hi';
              return { make };
            }
          `,
          errors: [{ messageId: 'arrowAssignedToMethodSignatureMember' }],
        },
      ],
    });
  });

  // Copilot review (#206 c2 — parity): literal computed property names (`['make']`, `[0]`) are
  // statically resolvable and must be flagged.
  it('flags HS-1128 for a literal computed property name with an arrow value', () => {
    ruleTester.run('arrow-assigned-to-method-signature-member', rule, {
      valid: [],
      invalid: [
        {
          code: `function createDeps(): { make(): string } { return { ['make']: () => 'hi' }; }`,
          errors: [{ messageId: 'arrowAssignedToMethodSignatureMember' }],
        },
      ],
    });
  });

  it('is suppressible with // hs:disable-next-line HS-1128 (parity with transpiler diagnostic)', () => {
    const wrapped = wrapRuleWithHsDisable(rule, 'arrow-assigned-to-method-signature-member');
    ruleTester.run('arrow-assigned-to-method-signature-member', wrapped, {
      valid: [
        {
          code: `function createDeps(): { make(): string } {
            return {
              // hs:disable-next-line HS-1128
              make: () => 'hello'
            };
          }`,
        },
      ],
      invalid: [],
    });
  });
});
