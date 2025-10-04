import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Warn about isNaN() usage as it is unreliable in BrightScript',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      isNaNUnreliable: 'isNaN() is unreliable in BrightScript. Consider using Number.isNaN() instead.',
    },
  },
  create: function (context) {
    return {
      CallExpression: function (node) {
        // Check for isNaN() function calls
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'isNaN'
        ) {
          context.report({
            node: node.callee,
            messageId: 'isNaNUnreliable',
          });
        }
      },
    };
  },
};

export default rule;
