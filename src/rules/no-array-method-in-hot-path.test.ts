import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-array-method-in-hot-path';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-array-method-in-hot-path', () => {
  it('flags array iteration methods in loop bodies and @hotPath functions', () => {
    ruleTester.run('no-array-method-in-hot-path', rule, {
      valid: [
        // cold path: top-level / plain function bodies are fine
        {
          code: `
          function setup(items: number[]) {
            return items.map(x => x * 2);
          }
          `,
        },
        // method without @hotPath tag
        {
          code: `
          class Layer {
            items: number[] = [];
            rebuild() {
              this.items.forEach(item => console.log(item));
            }
          }
          `,
        },
        // loop without array methods
        {
          code: `
          function update(items: number[]) {
            for (let i = 0; i < items.length; i++) {
              const v = items[i];
            }
          }
          `,
        },
        // array method inside a nested (non-callback) function declared in a loop is
        // not flagged: the function body does not execute per iteration
        {
          code: `
          function outer(groups: number[][]) {
            for (let i = 0; i < groups.length; i++) {
              const helper = function later(items: number[]) {
                return items.map(x => x + 1);
              };
            }
          }
          `,
        },
      ],
      invalid: [
        {
          code: `
          function update(groups: number[][]) {
            for (let i = 0; i < groups.length; i++) {
              groups[i].forEach(v => console.log(v));
            }
          }
          `,
          errors: [{ messageId: 'arrayMethodInHotPath' }],
        },
        {
          code: `
          function update(items: number[]) {
            let i = 0;
            while (i < 10) {
              const doubled = items.map(x => x * 2);
              i++;
            }
          }
          `,
          errors: [{ messageId: 'arrayMethodInHotPath' }],
        },
        {
          code: `
          class Layer {
            items: number[] = [];
            /** @hotPath — per-frame sprite sync */
            update() {
              this.items.forEach(item => console.log(item));
            }
          }
          `,
          errors: [{ messageId: 'arrayMethodInHotPath' }],
        },
        // inline callback inside a loop still executes per iteration
        {
          code: `
          function update(groups: number[][], run: (fn: () => void) => void) {
            for (let i = 0; i < groups.length; i++) {
              run(() => {
                groups[i].filter(v => v > 0);
              });
            }
          }
          `,
          errors: [{ messageId: 'arrayMethodInHotPath' }],
        },
      ],
    });
  });
});
