import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'HS-1119: The `>>>` operator is lowered to hs_unsigned_right_shift on Roku; matches transpiler warning.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      unsignedRightShift:
        'HS-1119: Unsigned right shift (`>>>`) is transpiled to hs_unsigned_right_shift (polyfill). Prefer explicit uint32 math if you need different semantics, or suppress with // hs:disable-next-line HS-1119.',
    },
  },
  create(context) {
    return {
      BinaryExpression(node) {
        if (node.operator === '>>>') {
          context.report({ node, messageId: 'unsignedRightShift' });
        }
      },
    };
  },
};

export default rule;
