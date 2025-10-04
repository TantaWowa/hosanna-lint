import { Rule } from 'eslint';

// String static methods that are not supported in Hosanna/BrightScript
const UNSUPPORTED_STRING_METHODS = new Set([
  'fromCharCode',
  'fromCodePoint',
  'raw'
]);

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow unsupported String static methods in Hosanna',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      unsupportedStringMethod: 'String static method "{{method}}" is not supported in Hosanna/BrightScript.',
    },
  },
  create: function (context) {
    return {
      CallExpression: function (node) {
        // Check for String.method() calls
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier' &&
          node.callee.object.name === 'String' &&
          node.callee.property.type === 'Identifier'
        ) {
          const methodName = node.callee.property.name;
          if (UNSUPPORTED_STRING_METHODS.has(methodName)) {
            context.report({
              node: node.callee.property,
              messageId: 'unsupportedStringMethod',
              data: { method: methodName },
            });
          }
        }
      },
    };
  },
};

export default rule;
