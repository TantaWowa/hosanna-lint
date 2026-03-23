import { Rule } from 'eslint';

/**
 * Matches UnaryExpression-utils: delete only supports MemberExpression targets.
 */
const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'HS-1016: delete operator argument must be a member expression.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      unsupportedDelete:
        'HS-1016: UnsupportedUseOfDeleteOperator: Unexpected argument type for delete operator.',
    },
  },
  create(context) {
    return {
      UnaryExpression(node) {
        if (node.operator !== 'delete') return;
        if (node.argument.type === 'MemberExpression') return;
        context.report({
          node,
          messageId: 'unsupportedDelete',
        });
      },
    };
  },
};

export default rule;
