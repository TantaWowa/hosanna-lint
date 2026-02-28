import { Rule } from 'eslint';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function containsFunctionCall(node: any): boolean {
  if (node.type === 'CallExpression') return true;

  if (node.type === 'LogicalExpression') {
    return containsFunctionCall(node.left) || containsFunctionCall(node.right);
  }
  if (node.type === 'ConditionalExpression') {
    return containsFunctionCall(node.test) || containsFunctionCall(node.consequent) || containsFunctionCall(node.alternate);
  }
  if (node.type === 'UnaryExpression') {
    return containsFunctionCall(node.argument);
  }

  return false;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'HS-1037: Warn about function calls in short-circuit logical assignment expressions that could cause recursion.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      recursionInLogicalExpression:
        'HS-1037: Function call detected in short-circuit logic assignment. Ensure these calls will not result in recursion to avoid side-effects.',
    },
  },
  create: function (context) {
    return {
      AssignmentExpression: function (node) {
        if (node.operator !== '=' || node.right.type !== 'LogicalExpression') return;

        const logical = node.right;
        if (logical.operator !== '||' && logical.operator !== '??') return;

        if (containsFunctionCall(logical.right as Rule.Node)) {
          context.report({ node: logical, messageId: 'recursionInLogicalExpression' });
        }
      },
    };
  },
};

export default rule;
