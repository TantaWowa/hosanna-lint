import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-this-in-non-arrow-closure';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-this-in-non-arrow-closure', () => {
  it('should report errors for this in function expressions assigned to variables', () => {
    ruleTester.run('no-this-in-non-arrow-closure', rule, {
      valid: [],
      invalid: [
        {
          code: `
            class MyClass {
              setupCallback() {
                const callback = function(event: any) {
                  return this.virtualPosition; // ERROR: this in non-arrow closure
                };
                return callback;
              }
            }
          `,
          errors: [
            {
              messageId: 'thisInNonArrowClosure',
            },
          ],
        },
        {
          code: `
            const handler = function() {
              return this.value;
            };
          `,
          errors: [
            {
              messageId: 'thisInNonArrowClosure',
            },
          ],
        },
      ],
    });
  });

  it('should report errors for this in function expressions assigned to properties', () => {
    ruleTester.run('no-this-in-non-arrow-closure', rule, {
      valid: [],
      invalid: [
        {
          code: `
            rowLayout.onRowRenderFinish = function(event: any) {
              const opacity = Math.min(((event.virtualX ?? this.virtualPosition) - 10) / 10 * 0.8, 0.8);
              return opacity;
            };
          `,
          errors: [
            {
              messageId: 'thisInNonArrowClosure',
            },
          ],
        },
        {
          code: `
            const obj: any = {};
            obj.callback = function() {
              return this.prop;
            };
          `,
          errors: [
            {
              messageId: 'thisInNonArrowClosure',
            },
          ],
        },
      ],
    });
  });

  it('should report errors for this in function expressions passed as arguments', () => {
    ruleTester.run('no-this-in-non-arrow-closure', rule, {
      valid: [],
      invalid: [
        {
          code: `
            setTimeout(function() {
              return this.value;
            }, 100);
          `,
          errors: [
            {
              messageId: 'thisInNonArrowClosure',
            },
          ],
        },
        {
          code: `
            array.map(function(item) {
              return this.process(item);
            });
          `,
          errors: [
            {
              messageId: 'thisInNonArrowClosure',
            },
          ],
        },
      ],
    });
  });

  it('should report errors for this in function expressions returned from functions', () => {
    ruleTester.run('no-this-in-non-arrow-closure', rule, {
      valid: [],
      invalid: [
        {
          code: `
            function createHandler() {
              return function() {
                return this.value;
              };
            }
          `,
          errors: [
            {
              messageId: 'thisInNonArrowClosure',
            },
          ],
        },
      ],
    });
  });

  it('should report errors for this in function expressions in arrays', () => {
    ruleTester.run('no-this-in-non-arrow-closure', rule, {
      valid: [],
      invalid: [
        {
          code: `
            const handlers = [
              function() {
                return this.value;
              }
            ];
          `,
          errors: [
            {
              messageId: 'thisInNonArrowClosure',
            },
          ],
        },
      ],
    });
  });

  it('should NOT report errors for this in arrow functions', () => {
    ruleTester.run('no-this-in-non-arrow-closure', rule, {
      valid: [
        `
          class MyClass {
            setupCallback() {
              const callback = () => {
                return this.virtualPosition; // OK: arrow function preserves this
              };
              return callback;
            }
          }
        `,
        `
          const handler = () => {
            return this.value;
          };
        `,
        `
          setTimeout(() => {
            return this.value;
          }, 100);
        `,
      ],
      invalid: [],
    });
  });

  it('should NOT report errors for this in regular class methods', () => {
    ruleTester.run('no-this-in-non-arrow-closure', rule, {
      valid: [
        `
          class MyClass {
            getValue() {
              return this.virtualPosition; // OK: regular method
            }
          }
        `,
        `
          class MyClass {
            method() {
              return this.prop;
            }
          }
        `,
      ],
      invalid: [],
    });
  });

  it('should NOT report errors for this in function declarations', () => {
    ruleTester.run('no-this-in-non-arrow-closure', rule, {
      valid: [
        `
          function myFunction() {
            return this.something; // OK: function declaration
          }
        `,
      ],
      invalid: [],
    });
  });

  it('should NOT report errors for this in function expressions that are method definitions', () => {
    ruleTester.run('no-this-in-non-arrow-closure', rule, {
      valid: [
        `
          class MyClass {
            method() {
              return this.value; // OK: class method (not a closure)
            }
          }
        `,
      ],
      invalid: [],
    });
  });

  it('should handle nested function expressions', () => {
    ruleTester.run('no-this-in-non-arrow-closure', rule, {
      valid: [],
      invalid: [
        {
          code: `
            function outer() {
              const inner = function() {
                return this.value; // ERROR: this in non-arrow closure
              };
              return inner;
            }
          `,
          errors: [
            {
              messageId: 'thisInNonArrowClosure',
            },
          ],
        },
        {
          code: `
            class MyClass {
              setup() {
                const callback = function() {
                  const nested = function() {
                    return this.value; // ERROR: this in nested non-arrow closure
                  };
                  return nested;
                };
                return callback;
              }
            }
          `,
          errors: [
            {
              messageId: 'thisInNonArrowClosure',
            },
          ],
        },
      ],
    });
  });

  it('should handle object literal properties', () => {
    ruleTester.run('no-this-in-non-arrow-closure', rule, {
      valid: [],
      invalid: [
        {
          code: `
            const obj = {
              handler: function() {
                return this.value; // ERROR: function expression in object literal
              }
            };
          `,
          errors: [
            {
              messageId: 'thisInNonArrowClosure',
            },
          ],
        },
      ],
    });
  });
});
