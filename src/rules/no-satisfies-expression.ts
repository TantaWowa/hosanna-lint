import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Warn when TypeScript satisfies expressions are erased by Hosanna',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      satisfiesExpressionErased: 'HS-1132: TypeScript `satisfies` is erased for BrightScript output. The runtime expression is emitted unchanged, but the type constraint is compile-time only.',
    },
  },
  create(context) {
    return {
      TSSatisfiesExpression(node) {
        context.report({
          node,
          messageId: 'satisfiesExpressionErased',
        });
      },
    };
  },
};

export default rule;
