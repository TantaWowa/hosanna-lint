import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Warn about Number.NaN usage as NaN is an approximation on Roku devices',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      nanApproximation: 'Number.NaN is an approximation on Roku devices. Avoid assigning NaN directly and be cautious with equality checks as behavior may vary.',
    },
  },
  create: function (context) {
    return {
      MemberExpression: function (node) {
        // Check for Number.NaN
        if (
          node.object.type === 'Identifier' &&
          node.object.name === 'Number' &&
          node.property.type === 'Identifier' &&
          node.property.name === 'NaN'
        ) {
          context.report({
            node,
            messageId: 'nanApproximation',
          });
        }
      },
    };
  },
};

export default rule;
