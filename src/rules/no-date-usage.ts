import { Rule } from 'eslint';

/**
 * Set of static methods that are supported on HsDate.
 * These match the transpiler's HSDATE_SUPPORTED_STATIC_METHODS.
 * The transpiler automatically converts Date usage to HsDate for these methods.
 */
const HSDATE_SUPPORTED_STATIC_METHODS = new Set([
  'sharedDate',
  'SetLocale',
  'GetLocale',
  'now',
  'parse',
  'UTC',
  'fromISOString',
  'fromTimestamp',
]);

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow unsupported Date usage in Hosanna. Date constructor and supported static methods are automatically converted to HsDate by the transpiler.',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      dateStaticMethodNotSupported:
        'HS-1052: DateFunctionNotSupported: date function "{{method}}" is not supported. The transpiler only supports: now, parse, UTC, sharedDate, SetLocale, GetLocale, fromISOString, fromTimestamp.',
      dateTypeNotSupported:
        "HS-1083: DateTypeNotSupported: Type 'Date' is not supported in Hosanna. Use 'HsDate' instead.",
      dateStaticMemberNotSupported:
        "HS-1084: DateStaticFunctionNotSupported: 'Date.{{name}}' is not supported in BrightScript. Please use 'HsDate' instead.",
    },
  },
  create: function (context) {
    /**
     * Gets the method name from a MemberExpression node.
     * Handles both non-computed (Date.now) and computed with string literal (Date['now']).
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function getMethodName(node: any): string | null {
      if (node.property.type === 'Identifier') {
        return node.property.name;
      }
      if (node.computed && node.property.type === 'Literal' && typeof node.property.value === 'string') {
        return node.property.value;
      }
      return null;
    }

    return {
      // new Date() is automatically converted by the transpiler, so we allow it
      // No need to check NewExpression

      // Check for Date.staticMethod() calls - only error on unsupported methods
      CallExpression: function (node) {
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier' &&
          node.callee.object.name === 'Date'
        ) {
          const methodName = getMethodName(node.callee);

          if (methodName && !HSDATE_SUPPORTED_STATIC_METHODS.has(methodName)) {
            context.report({
              node,
              messageId: 'dateStaticMethodNotSupported',
              data: {
                method: methodName,
              },
            });
          }
        }
      },

      // HS-1084: Date.unsupported as a value reference (not a direct call)
      MemberExpression: function (node) {
        if (node.object.type !== 'Identifier' || node.object.name !== 'Date') return;
        const staticName = getMethodName(node);
        if (!staticName) return;
        const p = node.parent;
        if (p.type === 'CallExpression' && p.callee === node) return;
        if (HSDATE_SUPPORTED_STATIC_METHODS.has(staticName)) return;
        context.report({
          node,
          messageId: 'dateStaticMemberNotSupported',
          data: { name: staticName },
        });
      },

      // Check for Date type annotations - these are not transpiled, so still error
      TSQualifiedName: function (node) {
        if (
          node.left.type === 'Identifier' &&
          node.left.name === 'Date'
        ) {
          context.report({
            node,
            messageId: 'dateTypeNotSupported',
          });
        }
      },

      // Check for Date in type references - these are not transpiled, so still error
      TSTypeReference: function (node) {
        if (
          node.typeName.type === 'Identifier' &&
          node.typeName.name === 'Date'
        ) {
          context.report({
            node,
            messageId: 'dateTypeNotSupported',
          });
        }
      },
    };
  },
};

export default rule;
