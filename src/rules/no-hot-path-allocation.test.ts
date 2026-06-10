import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-hot-path-allocation';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-hot-path-allocation', () => {
  it('ignores allocations in unmarked functions', () => {
    ruleTester.run('no-hot-path-allocation', rule, {
      valid: [
        'function build() { return { x: 1 }; }',
        'class Scene { buildWorld() { return [1, 2]; } }',
        'const make = () => new Map();',
        'class Scene { onStatsWindow() { this.status = `fps ${this.fps}`; } }',
      ],
      invalid: [],
    });
  });

  it('allows allocation-free hot paths', () => {
    ruleTester.run('no-hot-path-allocation', rule, {
      valid: [
        `class Scene {
          /** @hotPath */
          update(deltaMs) {
            this.x += deltaMs;
            for (let i = 0; i < this.items.length; i++) {
              const item = this.items[i];
              if (!item.active) continue;
              item.ageMs += deltaMs;
            }
          }
        }`,
        `/** @hotPath */
        function tick(pool) {
          let count = 0;
          for (let i = 0; i < pool.length; i++) count++;
          return count;
        }`,
        // plain template with no interpolation is a constant
        `class Scene {
          /** @hotPath */
          render(screen) { screen.DrawText(\`Paused\`, 1, 2, 3, this.font); }
        }`,
      ],
      invalid: [],
    });
  });

  it('flags object, array, new, closure, and interpolated template allocations in hot paths', () => {
    ruleTester.run('no-hot-path-allocation', rule, {
      valid: [],
      invalid: [
        {
          code: `class Scene {
            /** @hotPath */
            update(deltaMs) { this.camera.update({ x: this.x, y: this.y }); }
          }`,
          errors: [{ messageId: 'objectAllocation' }],
        },
        {
          code: `class Scene {
            /** @hotPath */
            update() { const points = [this.a, this.b]; return points; }
          }`,
          errors: [{ messageId: 'arrayAllocation' }],
        },
        {
          code: `class Scene {
            /** @hotPath */
            render(screen) { const v = new Vector(1, 2); }
          }`,
          errors: [{ messageId: 'newAllocation' }],
        },
        {
          code: `class Scene {
            /** @hotPath */
            update() { this.items.forEach(item => item.tick()); }
          }`,
          errors: [{ messageId: 'closureAllocation' }],
        },
        {
          code: `class Scene {
            /** @hotPath */
            render(screen) { screen.DrawText(\`HP \${this.hp}\`, 0, 0, 1, this.font); }
          }`,
          errors: [{ messageId: 'templateAllocation' }],
        },
        // line comments mark hot paths too
        {
          code: `// @hotPath
          function sync(pool) { return { count: pool.length }; }`,
          errors: [{ messageId: 'objectAllocation' }],
        },
      ],
    });
  });

  it('reports a closure once without descending into its body', () => {
    ruleTester.run('no-hot-path-allocation', rule, {
      valid: [],
      invalid: [
        {
          code: `class Scene {
            /** @hotPath */
            update() { this.items.map(item => ({ id: item.id })); }
          }`,
          // only the closure is reported; the object inside it is the closure's body
          errors: [{ messageId: 'closureAllocation' }],
        },
      ],
    });
  });
});
