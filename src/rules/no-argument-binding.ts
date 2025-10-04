import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow argument binding as it is not supported in Hosanna',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      argumentBindingNotSupported: 'Argument binding is not supported in Hosanna/BrightScript. Use arrow functions or explicit binding instead.',
    },
  },
  create: function (context) {
    return {
      // Check for .bind() method calls
      CallExpression: function (node) {
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'bind'
        ) {
          context.report({
            node: node.callee.property,
            messageId: 'argumentBindingNotSupported',
          });
        }
      },

    };
  },
};

export default rule;
