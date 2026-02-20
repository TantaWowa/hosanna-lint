import { Rule } from 'eslint';

/**
 * Promise static methods supported by HsPromise polyfill.
 * Any method not in this set is unsupported and will fail at runtime.
 */
const HSPROMISE_SUPPORTED_STATIC_METHODS = new Set([
  'resolve',
  'reject',
  'all',
  'race',
  'allSettled',
  'any',
]);

/**
 * Promise instance methods supported by HsPromise.
 * Any instance method not in this set is unsupported.
 */
const HSPROMISE_SUPPORTED_INSTANCE_METHODS = new Set([
  'then',
  'catch',
  'finally',
]);

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow unsupported Promise static and instance methods. HsPromise only supports resolve, reject, all, race, allSettled, any (static) and then, catch, finally (instance).',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      promiseStaticMethodNotSupported:
        'Promise.{{method}} is not supported in HsPromise. Supported static methods: resolve, reject, all, race, allSettled, any.',
      promiseInstanceMethodNotSupported:
        'Promise instance method "{{method}}" is not supported in HsPromise. Use then, catch, or finally instead.',
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
      // Check for Promise.staticMethod() - error on unsupported
      CallExpression: function (node) {
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier' &&
          node.callee.object.name === 'Promise'
        ) {
          const methodName = getMethodName(node.callee as Parameters<typeof getMethodName>[0]);

          if (methodName && !HSPROMISE_SUPPORTED_STATIC_METHODS.has(methodName)) {
            context.report({
              node,
              messageId: 'promiseStaticMethodNotSupported',
              data: { method: methodName },
            });
          }
        }

        // Check for promiseInstance.method() - error on unsupported instance methods
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.property.type === 'Identifier'
        ) {
          const methodName = node.callee.property.name;
          if (!HSPROMISE_SUPPORTED_INSTANCE_METHODS.has(methodName)) {
            // Only check if the object could be a Promise - common patterns
            const obj = node.callee.object;
            const couldBePromise =
              // Promise.resolve().foo() or Promise.reject().foo()
              (obj.type === 'CallExpression' &&
                obj.callee.type === 'MemberExpression' &&
                obj.callee.object.type === 'Identifier' &&
                obj.callee.object.name === 'Promise') ||
              // new Promise().foo()
              (obj.type === 'NewExpression' &&
                obj.callee.type === 'Identifier' &&
                obj.callee.name === 'Promise');

            if (couldBePromise) {
              context.report({
                node: node.callee.property,
                messageId: 'promiseInstanceMethodNotSupported',
                data: { method: methodName },
              });
            }
          }
        }
      },
    };
  },
};

export default rule;
