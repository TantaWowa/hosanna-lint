/* eslint-disable @typescript-eslint/no-explicit-any */
import { Rule } from 'eslint';

/**
 * Flags array iteration methods (forEach/map/filter/find/...) called inside loop
 * bodies or inside functions tagged with a `@hotPath` JSDoc comment.
 *
 * On Roku, array iteration methods lower to hs_array_* runtime helpers invoking a
 * function pointer per element, and an inline arrow allocates a closure (scope AA)
 * at the call site. In per-frame game code this is markedly slower than a plain
 * `for` loop. Cold-path usage is fine — this rule only fires where the code is
 * provably hot (inside a loop, or in a function the author tagged as a hot path).
 */

const ITERATION_METHODS = new Set([
  'forEach',
  'map',
  'filter',
  'find',
  'findIndex',
  'findLast',
  'findLastIndex',
  'some',
  'every',
  'reduce',
  'reduceRight',
  'flatMap',
]);

const LOOP_TYPES = new Set([
  'ForStatement',
  'ForOfStatement',
  'ForInStatement',
  'WhileStatement',
  'DoWhileStatement',
]);

const FUNCTION_TYPES = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression']);

const HOT_PATH_TAG = /@hotPath\b/;

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow array iteration methods (forEach/map/filter/...) inside loops or @hotPath-tagged functions; use a plain for loop on Roku hot paths.',
      category: 'Performance',
      recommended: true,
    },
    schema: [],
    messages: {
      arrayMethodInHotPath:
        'Array method "{{method}}" in a {{context}} lowers to an hs_array_* helper + function-pointer call per element on Roku. Use a plain for loop in hot paths.',
    },
  },
  create(context) {
    const sourceCode = context.sourceCode;

    function isHotPathFunction(node: Rule.Node): boolean {
      const comments = sourceCode.getCommentsBefore(node);
      if (comments.some(c => HOT_PATH_TAG.test(c.value))) {
        return true;
      }
      // class methods: JSDoc sits on the MethodDefinition, arrow class fields on the PropertyDefinition
      const parent = (node as any).parent;
      if (parent && (parent.type === 'MethodDefinition' || parent.type === 'PropertyDefinition' || parent.type === 'Property')) {
        const parentComments = sourceCode.getCommentsBefore(parent);
        if (parentComments.some(c => HOT_PATH_TAG.test(c.value))) {
          return true;
        }
      }
      return false;
    }

    /**
     * Walk ancestors: report when the call sits inside a loop body or a
     * @hotPath-tagged function. Stop at the first enclosing function for loop
     * detection EXCEPT when that function is itself an inline callback — a
     * callback created inside a loop still executes per iteration.
     */
    function findHotContext(node: Rule.Node): string | undefined {
      let current: any = (node as any).parent;
      while (current) {
        if (LOOP_TYPES.has(current.type)) {
          return 'loop body';
        }
        if (FUNCTION_TYPES.has(current.type)) {
          if (isHotPathFunction(current)) {
            return '@hotPath function';
          }
          // inline callbacks keep the enclosing context: a callback created in a
          // loop (or hot function) still executes per iteration
          const isInlineCallback =
            current.parent?.type === 'CallExpression' && current.parent.arguments?.includes(current);
          if (!isInlineCallback) {
            return undefined;
          }
        }
        current = current.parent;
      }
      return undefined;
    }

    return {
      CallExpression(node) {
        if (
          node.callee.type !== 'MemberExpression' ||
          node.callee.property.type !== 'Identifier' ||
          node.callee.computed
        ) {
          return;
        }
        const methodName = node.callee.property.name;
        if (!ITERATION_METHODS.has(methodName)) {
          return;
        }
        const hotContext = findHotContext(node as Rule.Node);
        if (!hotContext) {
          return;
        }
        context.report({
          node: node.callee.property,
          messageId: 'arrayMethodInHotPath',
          data: { method: methodName, context: hotContext },
        });
      },
    };
  },
};

export default rule;
