import { Rule } from 'eslint';

const BITWISE_BINARY_OPERATORS = new Set(['&', '|', '^']);
const BITWISE_ASSIGNMENT_OPERATORS = new Set(['&=', '|=', '^=']);

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'HS-1126: Warn when JavaScript bitwise operators are lowered through Roku helper functions.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      bitwiseOperatorPolyfill:
        'HS-1126: The "{{operator}}" operator is lowered through Hosanna bitwise helpers on Roku to preserve JavaScript ToInt32 behavior. This is slower than native BrightScript operators; avoid it in hot paths or suppress with // hs:disable-next-line HS-1126.',
    },
  },
  create(context) {
    return {
      BinaryExpression(node) {
        if (BITWISE_BINARY_OPERATORS.has(node.operator)) {
          context.report({
            node,
            messageId: 'bitwiseOperatorPolyfill',
            data: { operator: node.operator },
          });
        }
      },
      AssignmentExpression(node) {
        if (BITWISE_ASSIGNMENT_OPERATORS.has(node.operator)) {
          context.report({
            node,
            messageId: 'bitwiseOperatorPolyfill',
            data: { operator: node.operator },
          });
        }
      },
      UnaryExpression(node) {
        if (node.operator === '~') {
          context.report({
            node,
            messageId: 'bitwiseOperatorPolyfill',
            data: { operator: node.operator },
          });
        }
      },
    };
  },
};

export default rule;
