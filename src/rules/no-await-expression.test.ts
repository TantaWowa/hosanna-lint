import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-await-expression';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-await-expression', () => {
  it('should pass valid code without await', () => {
    ruleTester.run('no-await-expression', rule, {
      valid: [
        "const result = Promise.resolve(42);",
        "function regularFunction() { return 42; }",
        "const data = fetchData();",
        "someAsyncFunction().then(result => console.log(result));",
        "async function allowedAsyncFunction() { return 42; }",
      ],
      invalid: [],
    });
  });

  it('should report errors for await expressions', () => {
    ruleTester.run('no-await-expression', rule, {
      valid: [],
      invalid: [
        {
          code: "const result = await Promise.resolve(42);",
          errors: [
            {
              messageId: 'awaitNotSupported',
            },
          ],
        },
        {
          code: `
            async function example() {
              const data = await fetchData();
              return data;
            }
          `,
          errors: [
            {
              messageId: 'awaitNotSupported',
            },
          ],
        },
        {
          code: "const [a, b] = await Promise.all([promise1, promise2]);",
          errors: [
            {
              messageId: 'awaitNotSupported',
            },
          ],
        },
        {
          code: `
            try {
              const result = await someOperation();
              console.log(result);
            } catch (error) {
              console.error(error);
            }
          `,
          errors: [
            {
              messageId: 'awaitNotSupported',
            },
          ],
        },
      ],
    });
  });
});
