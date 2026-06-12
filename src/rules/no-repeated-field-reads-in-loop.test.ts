import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-repeated-field-reads-in-loop';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-repeated-field-reads-in-loop', () => {
  it('flags repeated this.field reads in loop bodies, skips written fields', () => {
    ruleTester.run('no-repeated-field-reads-in-loop', rule, {
      valid: [
        // below threshold (default 3)
        {
          code: `
          class Layer {
            width = 0;
            update(items: number[]) {
              for (let i = 0; i < items.length; i++) {
                const a = this.width + items[i];
                const b = this.width - items[i];
              }
            }
          }
          `,
        },
        // hoisted local — the recommended pattern
        {
          code: `
          class Layer {
            width = 0;
            update(items: number[]) {
              const width = this.width;
              for (let i = 0; i < items.length; i++) {
                const a = width + items[i] + width * 2 + width;
              }
            }
          }
          `,
        },
        // field is written in the loop: hoisting would change behavior
        {
          code: `
          class Layer {
            total = 0;
            update(items: number[]) {
              for (let i = 0; i < items.length; i++) {
                this.total = this.total + items[i];
                const x = this.total * 2;
              }
            }
          }
          `,
        },
        // method calls are not field reads
        {
          code: `
          class Layer {
            tick() { return 1; }
            update(items: number[]) {
              for (let i = 0; i < items.length; i++) {
                this.tick();
                this.tick();
                this.tick();
              }
            }
          }
          `,
        },
      ],
      invalid: [
        {
          code: `
          class Layer {
            width = 0;
            update(items: number[]) {
              for (let i = 0; i < items.length; i++) {
                const a = this.width + items[i];
                const b = this.width - items[i];
                const c = this.width * items[i];
              }
            }
          }
          `,
          errors: [{ messageId: 'repeatedFieldReads' }],
        },
        {
          code: `
          class Layer {
            scale = 1;
            update(items: number[]) {
              let i = 0;
              while (i < items.length) {
                const x = this.scale * items[i] + this.scale + this.scale;
                i++;
              }
            }
          }
          `,
          errors: [{ messageId: 'repeatedFieldReads' }],
        },
        // configurable threshold
        {
          code: `
          class Layer {
            width = 0;
            update(items: number[]) {
              for (let i = 0; i < items.length; i++) {
                const a = this.width + items[i];
                const b = this.width - items[i];
              }
            }
          }
          `,
          options: [{ minReads: 2 }],
          errors: [{ messageId: 'repeatedFieldReads' }],
        },
      ],
    });
  });
});
