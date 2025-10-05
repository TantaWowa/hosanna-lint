import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow Immediately Invoked Function Expressions as they are not supported in Hosanna',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      iifeNotSupported: 'Immediately Invoked Function Expressions are not supported - Create a variable and assign the function to it, then call the variable',
    },
  },
  create: function (context) {
    return {
      CallExpression: function (node) {
        // Check for classic IIFE pattern: (function() { ... })()
        // In practice, ESLint AST doesn't preserve parentheses as separate nodes,
        // but we check for direct function expressions as callees which covers IIFE patterns
        if (
          node.callee.type === 'FunctionExpression' ||
          node.callee.type === 'ArrowFunctionExpression'
        ) {
          context.report({
            node,
            messageId: 'iifeNotSupported',
          });
        }
      },
    };
  },
};

export default rule;
