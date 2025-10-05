import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow non-null operator on call expressions as it is not supported in Hosanna',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      nonNullOnCallNotSupported: 'Non-null operator on call expression is not supported in Hosanna/BrightScript. Use optional chaining instead.',
    },
  },
  create: function (context) {
    return {
      CallExpression: function (node) {
        // Check if the callee is a non-null expression (like foo.bar!())
        if ((node.callee as Rule.Node).type === 'TSNonNullExpression') {
          const nonNullExpr = node.callee as Rule.Node & { expression: Rule.Node }; // TypeScript doesn't know TSNonNullExpression has expression
          context.report({
            node: node.callee,
            messageId: 'nonNullOnCallNotSupported',
            fix: (fixer) => {
              // Replace expression!() with expression?.()
              const exprText = context.sourceCode.getText(nonNullExpr.expression);
              const argsText = node.arguments.map(arg => context.sourceCode.getText(arg)).join(', ');
              return fixer.replaceText(node, `${exprText}?.(${argsText})`);
            },
          });
        }
      },
    };
  },
};

export default rule;
