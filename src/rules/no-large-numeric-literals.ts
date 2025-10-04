import { Rule } from 'eslint';

// Maximum safe integer for Roku/BrightScript
const MAX_ROKU_SAFE_INT = 2147483647;

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Warn about numeric literals that exceed Roku\'s maximum safe integer',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      numericLiteralExceedsMaxRokuSafeInt: 'Numeric literal {{value}} exceeds Roku\'s maximum safe integer (2147483647). This may cause unexpected behavior.',
    },
  },
  create: function (context) {
    return {
      Literal: function (node) {
        // Check for numeric literals
        if (typeof node.value === 'number' && Number.isInteger(node.value)) {
          if (node.value > MAX_ROKU_SAFE_INT) {
            context.report({
              node,
              messageId: 'numericLiteralExceedsMaxRokuSafeInt',
              data: { value: node.value.toString() },
            });
          }
        }
      },
    };
  },
};

export default rule;
