import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'HS-1125: Statement-position `void` is erased for BrightScript output while the operand is still evaluated.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      statementVoidExpressionErased:
        'HS-1125: Statement-position `void` is erased for BrightScript output; the operand is still emitted and evaluated.',
    },
  },
  create(context) {
    return {
      ExpressionStatement(node) {
        const expression = node.expression;
        if (expression.type === 'UnaryExpression' && expression.operator === 'void') {
          context.report({ node: expression, messageId: 'statementVoidExpressionErased' });
        }
      },
    };
  },
};

export default rule;
