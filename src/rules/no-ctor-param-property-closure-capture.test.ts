import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-ctor-param-property-closure-capture';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-ctor-param-property-closure-capture', () => {
  it('allows shapes whose captures always worked', () => {
    ruleTester.run('no-ctor-param-property-closure-capture', rule, {
      valid: [
        // Plain (unmodified) constructor params always had Babel bindings — captured correctly
        'class Child extends Base { constructor(name: string) { super(() => name); } }',
        'class Child extends Base { constructor(offset: number) { super({ handler: (x: number) => x + offset }); } }',
        'class Child extends Base { constructor(name: string) { super(); this.handler = () => name; } }',
        // Module-level constants are in module scope, not ctor scope
        'const K = 1; class Child extends Base { constructor(private n: number) { super(() => K); } }',
        // this-references are captured via `m`, always safe
        'class Child extends Base { prefix = "p"; constructor(private n: number) { super(() => this.prefix); } }',
        'class Child extends Base { constructor(private n: number) { super(); this.get = () => this.n; } }',
        // Parameter property used directly (no closure) is evaluated eagerly — fine
        'class Child extends Base { constructor(private readonly context: SceneContext) { super(context.screenWidth); this.width = context.screenWidth; } }',
        // Closure param shadows the parameter property — resolves locally
        'class Child extends Base { constructor(private key: string) { super((key: string) => key); } }',
        // Constructor without parameter properties
        'class Child extends Base { constructor() { super(() => 1); } }',
        // Closures in ordinary methods are outside the constructor — bindings exist there
        'class C { constructor(private n: number) {} get() { return () => this.n; } }',
      ],
      invalid: [],
    });
  });

  it('flags closures in super(...) args referencing parameter properties (pre-1.32.0 lost capture)', () => {
    ruleTester.run('no-ctor-param-property-closure-capture', rule, {
      valid: [],
      invalid: [
        {
          // Direct closure argument
          code: 'class Child extends Base { constructor(private offset: number) { super((x: number) => x + offset); } }',
          errors: [{ messageId: 'superArgClosureCtorParamCapture', data: { name: 'offset' } }],
        },
        {
          // The original repro shape: options-object property closure
          code: 'class Child extends Base { constructor(private readonly context: SceneContext) { super({ width: 1280, resolveAssetUri: (key: string) => resolveUri(context, key) }); } }',
          errors: [{ messageId: 'superArgClosureCtorParamCapture', data: { name: 'context' } }],
        },
        {
          // Parameter property with a default value is still a TSParameterProperty
          code: 'class Child extends Base { constructor(private name: string = "a") { super(() => name); } }',
          errors: [{ messageId: 'superArgClosureCtorParamCapture', data: { name: 'name' } }],
        },
        {
          // Nested closures propagate the capture
          code: 'class Child extends Base { constructor(public name: string) { super({ h: () => () => name }); } }',
          errors: [{ messageId: 'superArgClosureCtorParamCapture', data: { name: 'name' } }],
        },
        {
          // function expressions are closures in the hosanna lowering too
          code: 'class Child extends Base { constructor(protected name: string) { super(function() { return name; }); } }',
          errors: [{ messageId: 'superArgClosureCtorParamCapture', data: { name: 'name' } }],
        },
        {
          // Multiple references each report
          code: 'class Child extends Base { constructor(private a: number, private b: number) { super(() => a + b); } }',
          errors: [
            { messageId: 'superArgClosureCtorParamCapture', data: { name: 'a' } },
            { messageId: 'superArgClosureCtorParamCapture', data: { name: 'b' } },
          ],
        },
      ],
    });
  });

  it('flags closures anywhere in the constructor body (same pre-1.32.0 mechanism) and suggests this.x', () => {
    ruleTester.run('no-ctor-param-property-closure-capture', rule, {
      valid: [],
      invalid: [
        {
          // Field-handler assignment after super — this.x is already assigned, suggestion applies
          code: 'class Child extends Base { constructor(private name: string) { super(); this.handler = () => name; } }',
          errors: [
            {
              messageId: 'ctorBodyClosureCtorParamCapture',
              data: { name: 'name' },
              suggestions: [
                {
                  messageId: 'replaceWithThisReference',
                  output: 'class Child extends Base { constructor(private name: string) { super(); this.handler = () => this.name; } }',
                },
              ],
            },
          ],
        },
        {
          // Base class (no super call) — parameter properties are assigned at ctor start
          code: 'class C { constructor(private id: string) { this.log = () => console.info(id); } }',
          errors: [
            {
              messageId: 'ctorBodyClosureCtorParamCapture',
              data: { name: 'id' },
              suggestions: [
                {
                  messageId: 'replaceWithThisReference',
                  output: 'class C { constructor(private id: string) { this.log = () => console.info(this.id); } }',
                },
              ],
            },
          ],
        },
        {
          // Shorthand object property gets expanded, not textually mangled
          code: 'class C { constructor(private name: string) { this.make = () => ({ name }); } }',
          errors: [
            {
              messageId: 'ctorBodyClosureCtorParamCapture',
              data: { name: 'name' },
              suggestions: [
                {
                  messageId: 'replaceWithThisReference',
                  output: 'class C { constructor(private name: string) { this.make = () => ({ name: this.name }); } }',
                },
              ],
            },
          ],
        },
        {
          // function expression closures rebind this — flagged, but no this.x suggestion
          code: 'class C { constructor(private name: string) { this.handler = function() { return name; }; } }',
          errors: [
            {
              messageId: 'ctorBodyClosureCtorParamCapture',
              data: { name: 'name' },
            },
          ],
        },
        {
          // Callback passed to a call in the ctor body
          code: 'class C extends Base { constructor(private id: string) { super(); setTimeout(() => cancel(id), 100); } }',
          errors: [
            {
              messageId: 'ctorBodyClosureCtorParamCapture',
              data: { name: 'id' },
              suggestions: [
                {
                  messageId: 'replaceWithThisReference',
                  output: 'class C extends Base { constructor(private id: string) { super(); setTimeout(() => cancel(this.id), 100); } }',
                },
              ],
            },
          ],
        },
      ],
    });
  });
});
