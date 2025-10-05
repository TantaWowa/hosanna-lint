import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow Number.EPSILON usage as it is not supported in Hosanna',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      epsilonNotSupported: 'Number.EPSILON is approximated as 0.0001 on BrightScript platform.',
    },
  },
  create: function (context) {
    return {
      MemberExpression: function (node) {
        // Check for Number.EPSILON
        if (
          node.object.type === 'Identifier' &&
          node.object.name === 'Number' &&
          node.property.type === 'Identifier' &&
          node.property.name === 'EPSILON'
        ) {
          context.report({
            node,
            messageId: 'epsilonNotSupported',
            fix: (fixer) => {
              return fixer.replaceText(node, '0.0001');
            },
          });
        }
      },
    };
  },
};

export default rule;
