import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-super-arg-closure-ctor-param-capture';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-super-arg-closure-ctor-param-capture', () => {
  it('allows shapes whose captures always worked', () => {
    ruleTester.run('no-super-arg-closure-ctor-param-capture', rule, {
      valid: [
        // Plain (unmodified) constructor params always had Babel bindings — captured correctly
        'class Child extends Base { constructor(name: string) { super(() => name); } }',
        'class Child extends Base { constructor(offset: number) { super({ handler: (x: number) => x + offset }); } }',
        // Module-level constants are in module scope, not ctor scope
        'const K = 1; class Child extends Base { constructor(private n: number) { super(() => K); } }',
        // this-references are captured via `m`, always safe
        'class Child extends Base { prefix = "p"; constructor(private n: number) { super(() => this.prefix); } }',
        // Parameter property used directly in super args (no closure) is evaluated eagerly — fine
        'class Child extends Base { constructor(private readonly context: SceneContext) { super(context.screenWidth); } }',
        // Closure param shadows the parameter property — resolves locally
        'class Child extends Base { constructor(private key: string) { super((key: string) => key); } }',
        // super() in a class without parameter properties
        'class Child extends Base { constructor() { super(() => 1); } }',
      ],
      invalid: [],
    });
  });

  it('flags closures in super(...) args referencing parameter properties (pre-1.32.0 lost capture)', () => {
    ruleTester.run('no-super-arg-closure-ctor-param-capture', rule, {
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
});
