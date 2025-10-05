import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Warn about isNaN() usage as it is emulated on BrightScript and may be unreliable',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      isNaNEmulated: 'isNaN() is emulated on BrightScript and may be unreliable.',
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
            messageId: 'isNaNEmulated',
          });
        }
      },
    };
  },
};

export default rule;
