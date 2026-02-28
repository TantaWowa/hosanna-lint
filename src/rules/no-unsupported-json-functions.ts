import { Rule } from 'eslint';

const SUPPORTED_JSON_METHODS = new Set(['parse', 'stringify']);

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'HS-1045: Disallow unsupported JSON functions. Only JSON.parse and JSON.stringify are supported in Hosanna/BrightScript.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      unsupportedJsonFunction:
        'HS-1045: JSON function "{{name}}" is not supported in Hosanna/BrightScript. Only JSON.parse and JSON.stringify are supported.',
    },
  },
  create: function (context) {
    return {
      CallExpression: function (node) {
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier' &&
          node.callee.object.name === 'JSON' &&
          node.callee.property.type === 'Identifier' &&
          !SUPPORTED_JSON_METHODS.has(node.callee.property.name)
        ) {
          context.report({
            node: node.callee.property,
            messageId: 'unsupportedJsonFunction',
            data: { name: node.callee.property.name },
          });
        }
      },
    };
  },
};

export default rule;
