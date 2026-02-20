import { Rule } from 'eslint';

/**
 * Promise static methods that are polyfilled by HsPromise.
 * Using these triggers the polyfill - warn to make developers aware.
 */
const HSPROMISE_POLYFILLED_STATIC_METHODS = new Set([
  'resolve',
  'reject',
  'all',
  'race',
  'allSettled',
  'any',
]);

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Warn when using Promise static methods - these are polyfilled by HsPromise in Hosanna/Roku.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      promiseStaticPolyfilled:
        'Promise.{{method}} uses polyfilled HsPromise implementation. Be aware of Roku-specific behavior.',
      promiseConstructorPolyfilled:
        'new Promise() uses polyfilled HsPromise implementation. Consider using new HsPromise() from @hs-src/hosanna-bridge-lib/Promises for clarity.',
    },
  },
  create: function (context) {
    function getMethodName(node: {
      property: { type: string; name?: string; value?: string };
      computed?: boolean;
    }): string | null {
      if (node.property.type === 'Identifier') {
        return node.property.name ?? null;
      }
      if (
        node.computed &&
        (node.property as { type: string; value?: string }).type === 'Literal' &&
        typeof (node.property as { value?: string }).value === 'string'
      ) {
        return (node.property as { value: string }).value ?? null;
      }
      return null;
    }

    return {
      // Check for Promise.staticMethod() calls
      CallExpression: function (node) {
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier' &&
          node.callee.object.name === 'Promise'
        ) {
          const methodName = getMethodName(node.callee as Parameters<typeof getMethodName>[0]);

          if (methodName && HSPROMISE_POLYFILLED_STATIC_METHODS.has(methodName)) {
            context.report({
              node,
              messageId: 'promiseStaticPolyfilled',
              data: { method: methodName },
            });
          }
        }
      },

      // Check for new Promise()
      NewExpression: function (node) {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'Promise'
        ) {
          context.report({
            node,
            messageId: 'promiseConstructorPolyfilled',
          });
        }
      },
    };
  },
};

export default rule;
