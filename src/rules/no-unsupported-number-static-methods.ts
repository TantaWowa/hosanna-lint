import { Rule } from 'eslint';

const SUPPORTED_NUMBER_STATIC_METHODS = new Set([
  'isFinite', 'isInteger', 'isNaN', 'isSafeInteger',
  'parseFloat', 'parseInt', 'toString',
]);

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'HS-1064: Disallow unsupported Number static methods in Hosanna/BrightScript.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      unsupportedNumberStaticMethod:
        'HS-1064: Number static method "{{method}}" is not supported in Hosanna/BrightScript.',
    },
  },
  create: function (context) {
    return {
      CallExpression: function (node) {
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier' &&
          node.callee.object.name === 'Number' &&
          node.callee.property.type === 'Identifier' &&
          !SUPPORTED_NUMBER_STATIC_METHODS.has(node.callee.property.name)
        ) {
          context.report({
            node: node.callee.property,
            messageId: 'unsupportedNumberStaticMethod',
            data: { method: node.callee.property.name },
          });
        }
      },
    };
  },
};

export default rule;
