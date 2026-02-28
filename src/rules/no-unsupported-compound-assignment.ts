import { Rule } from 'eslint';

const SUPPORTED_ASSIGNMENT_OPERATORS = new Set([
  '=', '+=', '-=', '*=', '/=',
]);

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'HS-1039: Disallow unsupported compound assignment operators. BrightScript only supports =, +=, -=, *=, /=.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      unsupportedCompoundAssignment:
        'HS-1039: The compound assignment operator "{{operator}}" is not supported in BrightScript. Only =, +=, -=, *=, /= are supported.',
    },
  },
  create: function (context) {
    return {
      AssignmentExpression: function (node) {
        if (!SUPPORTED_ASSIGNMENT_OPERATORS.has(node.operator)) {
          context.report({
            node,
            messageId: 'unsupportedCompoundAssignment',
            data: { operator: node.operator },
          });
        }
      },
    };
  },
};

export default rule;
