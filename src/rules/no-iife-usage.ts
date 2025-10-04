import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Warns about Immediately Invoked Function Expressions as they may not work as expected in Hosanna',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      iifeNotSupported: 'Immediately Invoked Function Expressions may not work as expected in Hosanna/BrightScript.',
    },
  },
  create: function (context) {
    return {
      CallExpression: function (node) {
        // Check for classic IIFE pattern: (function() { ... })()
        // We check if the callee is a function expression/arrow function
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
