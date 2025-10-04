import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-inline-classes';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-inline-classes', () => {
  it('should pass valid top-level class declarations', () => {
    ruleTester.run('no-inline-classes', rule, {
      valid: [
        `
          class MyClass {
            constructor() {}
            method() {}
          }
        `,
        `
          export class ExportedClass {
            value: number;
          }
        `,
        `
          export default class DefaultClass {
            constructor(public name: string) {}
          }
        `,
        `
          abstract class AbstractClass {
            abstract method(): void;
          }
        `,
      ],
      invalid: [],
    });
  });

  it('should report errors for inline class declarations in functions', () => {
    ruleTester.run('no-inline-classes', rule, {
      valid: [],
      invalid: [
        {
          code: `
            function createClass() {
              class InlineClass {
                constructor() {}
              }
              return new InlineClass();
            }
          `,
          errors: [
            {
              messageId: 'inlineClassNotAllowed',
            },
          ],
        },
        {
          code: `
            const factory = () => {
              class NestedClass {
                method() { return 42; }
              }
              return NestedClass;
            };
          `,
          errors: [
            {
              messageId: 'inlineClassNotAllowed',
            },
          ],
        },
        {
          code: `
            function outer() {
              const inner = function() {
                class DeeplyNested {
                  value = 42;
                }
                return new DeeplyNested();
              };
              return inner();
            }
          `,
          errors: [
            {
              messageId: 'inlineClassNotAllowed',
            },
          ],
        },
      ],
    });
  });

  it('should report errors for inline classes in methods', () => {
    ruleTester.run('no-inline-classes', rule, {
      valid: [],
      invalid: [
        {
          code: `
            class MyClass {
              createNestedClass() {
                class NestedClass {
                  method() { return 'nested'; }
                }
                return new NestedClass();
              }
            }
          `,
          errors: [
            {
              messageId: 'inlineClassNotAllowed',
            },
          ],
        },
        {
          code: `
            class Container {
              factory = () => {
                class Inline {
                  value: string;
                }
                return Inline;
              };
            }
          `,
          errors: [
            {
              messageId: 'inlineClassNotAllowed',
            },
          ],
        },
      ],
    });
  });

  it('should report errors for class expressions in functions', () => {
    ruleTester.run('no-inline-classes', rule, {
      valid: [],
      invalid: [
        {
          code: `
            function createAnonymousClass() {
              return class {
                method() { return 42; }
              };
            }
          `,
          errors: [
            {
              messageId: 'inlineClassNotAllowed',
            },
          ],
        },
        {
          code: `
            const createClass = () => class Anonymous {
              constructor(public value: number) {}
            };
          `,
          errors: [
            {
              messageId: 'inlineClassNotAllowed',
            },
          ],
        },
      ],
    });
  });
});
