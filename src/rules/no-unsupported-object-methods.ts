import { Rule } from 'eslint';

const SUPPORTED_OBJECT_STATIC_METHODS = new Set([
  'keys', 'values', 'entries', 'assign',
  'defineProperty', 'defineProperties', 'getOwnPropertyNames',
]);

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'HS-1050/1051: Disallow unsupported Object static methods in Hosanna/BrightScript.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      unsupportedObjectMethod:
        'HS-1051: Object static method "{{method}}" is not supported in Hosanna/BrightScript.',
    },
  },
  create: function (context) {
    return {
      CallExpression: function (node) {
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier' &&
          node.callee.object.name === 'Object' &&
          node.callee.property.type === 'Identifier' &&
          !SUPPORTED_OBJECT_STATIC_METHODS.has(node.callee.property.name)
        ) {
          context.report({
            node: node.callee.property,
            messageId: 'unsupportedObjectMethod',
            data: { method: node.callee.property.name },
          });
        }
      },
    };
  },
};

export default rule;
