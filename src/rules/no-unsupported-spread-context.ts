import { Rule } from 'eslint';

/**
 * Aligns with SpreadUtils.onSpreadElementExit: spread is only lowered inside
 * array literals, call expressions, or object literals. Other parents get HS-1093.
 */
const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'HS-1093 / HS-1005: Spread operator is not supported outside array/object literals or call arguments.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      unsupportedSpread:
        'HS-1093: Spread operator is not supported in this context. Use spread only inside array literals, object literals, or function call arguments.',
    },
  },
  create(context) {
    return {
      SpreadElement(node) {
        const parent = node.parent;
        const t = parent.type;
        if (t === 'ArrayExpression' || t === 'CallExpression' || t === 'ObjectExpression') {
          return;
        }
        context.report({
          node,
          messageId: 'unsupportedSpread',
        });
      },
    };
  },
};

export default rule;
