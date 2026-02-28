import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'HS-1071: Disallow .bind() with argument binding (more than 1 argument). Only .bind(thisArg) is supported.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      argumentBindingNotSupported:
        'HS-1071: Argument binding via .bind() is not supported. Only .bind(thisArg) is allowed. Use default parameter values or a wrapper function instead.',
    },
  },
  create: function (context) {
    return {
      CallExpression: function (node) {
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'bind' &&
          node.arguments.length > 1
        ) {
          context.report({ node, messageId: 'argumentBindingNotSupported' });
        }
      },
    };
  },
};

export default rule;
