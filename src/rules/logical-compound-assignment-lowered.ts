import { Rule } from 'eslint';

const LOGICAL_ASSIGNMENT_OPERATORS = new Set(['&&=', '||=', '??=']);

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'HS-1127: Warn when logical compound assignment is lowered to an if-statement on Roku.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      logicalCompoundAssignmentLowered:
        'HS-1127: The "{{operator}}" operator is lowered to an if-statement on Roku. Short-circuiting is preserved, but complex assignment targets can be evaluated again when the write occurs; avoid side-effectful targets or suppress with // hs:disable-next-line HS-1127.',
    },
  },
  create(context) {
    return {
      AssignmentExpression(node) {
        if (LOGICAL_ASSIGNMENT_OPERATORS.has(node.operator)) {
          context.report({
            node,
            messageId: 'logicalCompoundAssignmentLowered',
            data: { operator: node.operator },
          });
        }
      },
    };
  },
};

export default rule;
