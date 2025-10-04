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
      TSNonNullExpression: function (node) {
        // Check if the expression being made non-null is a call expression
        if (node.expression.type === 'CallExpression') {
          context.report({
            node,
            messageId: 'nonNullOnCallNotSupported',
            fix: (fixer) => {
              // Replace func()! with func()?.
              // This is a simplistic fix - in reality, you'd need to handle the return value properly
              const callText = context.getSourceCode().getText(node.expression);
              return fixer.replaceText(node, `${callText}?`);
            },
          });
        }
      },
    };
  },
};

export default rule;
