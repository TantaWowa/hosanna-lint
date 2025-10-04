import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow delete operator usage as it is not supported in Hosanna/BrightScript',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      unsupportedDeleteOperator: 'Delete operator is not supported in Hosanna/BrightScript.',
    },
  },
  create: function (context) {
    return {
      UnaryExpression: function (node) {
        // Check for delete operator
        if (node.operator === 'delete') {
          context.report({
            node,
            messageId: 'unsupportedDeleteOperator',
          });
        }
      },
    };
  },
};

export default rule;
