/* eslint-disable @typescript-eslint/no-explicit-any */
import { Rule } from 'eslint';

/**
 * Flags repeated reads of the same `this.<field>` inside a loop body, suggesting
 * the value be hoisted into a local before the loop.
 *
 * On Roku, `this.field` lowers to an `m.field` AA lookup per read — markedly more
 * expensive than a local variable in the BrightScript interpreter. Hot game loops
 * reading the same field every iteration pay that cost N times.
 *
 * Conservative by design:
 * - only `this.<identifier>` reads count (no computed access, no deep chains)
 * - fields that are written anywhere in the loop body are skipped (hoisting a
 *   mutated field would change behavior)
 * - method calls (`this.foo()`) are not counted as reads of `foo`
 * - reads inside nested functions are skipped (capture semantics differ)
 *
 * Off by default in `recommended`; enable for hot-path code (e.g. game engine /
 * per-frame modules) via a scoped override.
 */

const LOOP_TYPES = new Set([
  'ForStatement',
  'ForOfStatement',
  'ForInStatement',
  'WhileStatement',
  'DoWhileStatement',
]);

const FUNCTION_TYPES = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression']);

const DEFAULT_MIN_READS = 3;

interface FieldUsage {
  reads: { node: any }[];
  written: boolean;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Suggest hoisting repeated this.<field> reads inside loop bodies into a local variable (m.field AA lookups are expensive on Roku).',
      category: 'Performance',
      recommended: false,
    },
    schema: [
      {
        type: 'object',
        properties: {
          minReads: { type: 'integer', minimum: 2 },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      repeatedFieldReads:
        '"this.{{field}}" is read {{count}} times in this loop body; each read is an m-AA lookup on Roku. Hoist it into a local before the loop (const {{field}} = this.{{field}}).',
    },
  },
  create(context) {
    const options = (context.options?.[0] ?? {}) as { minReads?: number };
    const minReads = options.minReads ?? DEFAULT_MIN_READS;

    function isThisFieldRead(node: any): string | undefined {
      if (
        node.type !== 'MemberExpression' ||
        node.computed ||
        node.object.type !== 'ThisExpression' ||
        node.property.type !== 'Identifier'
      ) {
        return undefined;
      }
      return node.property.name;
    }

    function isWriteTarget(node: any): boolean {
      const parent = node.parent;
      if (!parent) return false;
      if (parent.type === 'AssignmentExpression' && parent.left === node) return true;
      if (parent.type === 'UpdateExpression' && parent.argument === node) return true;
      return false;
    }

    function isCallee(node: any): boolean {
      const parent = node.parent;
      return !!parent && parent.type === 'CallExpression' && parent.callee === node;
    }

    function collectUsages(body: any): Map<string, FieldUsage> {
      const usages = new Map<string, FieldUsage>();

      function visit(node: any, insideNestedFunction: boolean): void {
        if (!node || typeof node.type !== 'string') return;

        // nested loops report their own findings; skip them here to avoid
        // duplicate reports on the same reads
        if (node !== body && LOOP_TYPES.has(node.type)) return;

        const nested = insideNestedFunction || FUNCTION_TYPES.has(node.type);

        const field = isThisFieldRead(node);
        if (field) {
          let usage = usages.get(field);
          if (!usage) {
            usage = { reads: [], written: false };
            usages.set(field, usage);
          }
          if (isWriteTarget(node)) {
            usage.written = true;
          } else if (!nested && !isCallee(node)) {
            usage.reads.push({ node });
          }
        }

        for (const key of Object.keys(node)) {
          if (key === 'parent') continue;
          const value = node[key];
          if (Array.isArray(value)) {
            for (const item of value) {
              if (item && typeof item.type === 'string') visit(item, nested);
            }
          } else if (value && typeof value.type === 'string') {
            visit(value, nested);
          }
        }
      }

      visit(body, false);
      return usages;
    }

    function checkLoop(node: any) {
      const body = node.body;
      if (!body) return;
      const usages = collectUsages(body);
      for (const [field, usage] of usages) {
        if (usage.written || usage.reads.length < minReads) continue;
        context.report({
          node: usage.reads[0].node,
          messageId: 'repeatedFieldReads',
          data: { field, count: String(usage.reads.length) },
        });
      }
    }

    // use :exit so all descendants have been visited and parent links are set
    const handlers: Rule.RuleListener = {};
    for (const loopType of LOOP_TYPES) {
      (handlers as any)[`${loopType}:exit`] = checkLoop;
    }
    return handlers;
  },
};

export default rule;
