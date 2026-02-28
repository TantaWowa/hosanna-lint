import { Rule } from 'eslint';

const MAX_LOGICAL_OPERANDS = 32;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function countOperands(node: any): number {
  if (node.type === 'LogicalExpression') {
    return countOperands(node.left) + countOperands(node.right);
  }
  return 1;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: `HS-1036: Disallow logical expressions with more than ${MAX_LOGICAL_OPERANDS} operands. BrightScript has a limit on expression complexity.`,
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      logicalExpressionExceedsLimit:
        `HS-1036: This logical expression has too many operands ({{count}}). BrightScript only allows up to ${MAX_LOGICAL_OPERANDS}. Split into variables or use if statements.`,
    },
  },
  create: function (context) {
    return {
      LogicalExpression: function (node) {
        if (node.parent?.type === 'LogicalExpression') {
          return;
        }

        const count = countOperands(node);
        if (count > MAX_LOGICAL_OPERANDS) {
          context.report({
            node,
            messageId: 'logicalExpressionExceedsLimit',
            data: { count: String(count) },
          });
        }
      },
    };
  },
};

export default rule;
