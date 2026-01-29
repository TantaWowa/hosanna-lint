import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-conditional-compilation-else';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-conditional-compilation-else', () => {
  it('should pass valid code without conditional flags', () => {
    ruleTester.run('no-conditional-compilation-else', rule, {
      valid: [
        'if (someVariable) { doSomething(); }',
        'if (someVariable) { doSomething(); } else { doSomethingElse(); }',
        'if (someVariable) { doSomething(); } else if (otherVariable) { doSomethingElse(); }',
        'if (someVariable) { doSomething(); } else if (otherVariable) { doSomethingElse(); } else { final(); }',
      ],
      invalid: [],
    });
  });

  it('should pass valid conditional compilation without else', () => {
    ruleTester.run('no-conditional-compilation-else', rule, {
      valid: [
        'if (__ROKU__) { doSomething(); }',
        'if (__APPLE__) { doSomething(); }',
        'if (__WEB__) { doSomething(); }',
        'if (__ANDROID__) { doSomething(); }',
        'if (__DEV__) { doSomething(); }',
        `
          if (__ROKU__) {
            doSomething();
          }
        `,
        `
          if (__ROKU__) {
            doSomething();
          }
          if (__APPLE__) {
            doSomethingElse();
          }
        `,
      ],
      invalid: [],
    });
  });

  it('should report errors for if-else with conditional flags', () => {
    ruleTester.run('no-conditional-compilation-else', rule, {
      valid: [],
      invalid: [
        {
          code: `
            if (__ROKU__) {
              doSomething();
            } else {
              doSomethingElse();
            }
          `,
          errors: [
            {
              messageId: 'conditionalCompilationElseNotSupported',
            },
          ],
        },
        {
          code: `
            if (__APPLE__) {
              doSomething();
            } else {
              doSomethingElse();
            }
          `,
          errors: [
            {
              messageId: 'conditionalCompilationElseNotSupported',
            },
          ],
        },
        {
          code: `
            if (__WEB__) {
              doSomething();
            } else {
              doSomethingElse();
            }
          `,
          errors: [
            {
              messageId: 'conditionalCompilationElseNotSupported',
            },
          ],
        },
      ],
    });
  });

  it('should report errors for if-else-if with conditional flags', () => {
    ruleTester.run('no-conditional-compilation-else', rule, {
      valid: [],
      invalid: [
        {
          code: `
            if (__ROKU__) {
              doSomething();
            } else if (__APPLE__) {
              doSomethingElse();
            }
          `,
          errors: [
            {
              messageId: 'conditionalCompilationElseNotSupported',
            },
          ],
        },
        {
          code: `
            if (__ROKU__) {
              doSomething();
            } else if (__WEB__) {
              doSomethingElse();
            }
          `,
          errors: [
            {
              messageId: 'conditionalCompilationElseNotSupported',
            },
          ],
        },
      ],
    });
  });

  it('should report errors for if-else-if-else with conditional flags', () => {
    ruleTester.run('no-conditional-compilation-else', rule, {
      valid: [],
      invalid: [
        {
          code: `
            if (__ROKU__) {
              doSomething();
            } else if (__APPLE__) {
              doSomethingElse();
            } else {
              final();
            }
          `,
          errors: [
            {
              messageId: 'conditionalCompilationElseNotSupported',
            },
          ],
        },
        {
          code: `
            if (__ROKU__) {
              doSomething();
            } else if (__APPLE__) {
              doSomethingElse();
            } else if (__WEB__) {
              anotherThing();
            } else {
              final();
            }
          `,
          errors: [
            {
              messageId: 'conditionalCompilationElseNotSupported',
            },
          ],
        },
      ],
    });
  });

  it('should report errors for nested conditional compilation with else', () => {
    ruleTester.run('no-conditional-compilation-else', rule, {
      valid: [],
      invalid: [
        {
          code: `
            if (__ROKU__) {
              if (__DEV__) {
                doSomething();
              } else {
                doSomethingElse();
              }
            }
          `,
          errors: [
            {
              messageId: 'conditionalCompilationElseNotSupported',
            },
          ],
        },
      ],
    });
  });

  it('should handle complex conditional expressions', () => {
    ruleTester.run('no-conditional-compilation-else', rule, {
      valid: [
        'if (__ROKU__ && someOtherCondition) { doSomething(); }',
        'if (__ROKU__ || someOtherCondition) { doSomething(); }',
        'if (!__ROKU__) { doSomething(); }',
      ],
      invalid: [
        {
          code: `
            if (__ROKU__ && someOtherCondition) {
              doSomething();
            } else {
              doSomethingElse();
            }
          `,
          errors: [
            {
              messageId: 'conditionalCompilationElseNotSupported',
            },
          ],
        },
        {
          code: `
            if (__ROKU__ || __APPLE__) {
              doSomething();
            } else {
              doSomethingElse();
            }
          `,
          errors: [
            {
              messageId: 'conditionalCompilationElseNotSupported',
            },
          ],
        },
      ],
    });
  });

  it('should report errors when initial if uses conditional flag even if else-if does not', () => {
    ruleTester.run('no-conditional-compilation-else', rule, {
      valid: [],
      invalid: [
        {
          code: `
            if (__ROKU__) {
              doSomething();
            } else if (regularVariable) {
              doSomethingElse();
            }
          `,
          errors: [
            {
              messageId: 'conditionalCompilationElseNotSupported',
            },
          ],
        },
      ],
    });
  });

  it('should report errors when else-if uses conditional flag even if initial if does not', () => {
    ruleTester.run('no-conditional-compilation-else', rule, {
      valid: [],
      invalid: [
        {
          code: `
            if (regularVariable) {
              doSomething();
            } else if (__ROKU__) {
              doSomethingElse();
            }
          `,
          errors: [
            {
              messageId: 'conditionalCompilationElseNotSupported',
            },
          ],
        },
      ],
    });
  });

  it('should handle various conditional flag patterns', () => {
    ruleTester.run('no-conditional-compilation-else', rule, {
      valid: [
        'if (__ROKU__) { doSomething(); }',
        'if (__APPLE_TV__) { doSomething(); }',
        'if (__ANDROID_TV__) { doSomething(); }',
        'if (__DEV_MODE__) { doSomething(); }',
      ],
      invalid: [
        {
          code: `
            if (__ROKU__) {
              doSomething();
            } else {
              doSomethingElse();
            }
          `,
          errors: [
            {
              messageId: 'conditionalCompilationElseNotSupported',
            },
          ],
        },
        {
          code: `
            if (__APPLE_TV__) {
              doSomething();
            } else {
              doSomethingElse();
            }
          `,
          errors: [
            {
              messageId: 'conditionalCompilationElseNotSupported',
            },
          ],
        },
      ],
    });
  });
});
