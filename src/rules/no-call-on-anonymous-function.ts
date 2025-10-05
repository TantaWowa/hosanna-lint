import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow calls on anonymous function expressions as they may lack type information',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      callOnAnonymousFunctionNotPermitted: 'Call on anonymous function value is not permitted. To remedy, ensure the call has type information, e.g. function(func: () => void) { func(); }',
    },
  },
  create: function (context) {
    return {
      CallExpression: function (node) {
        // Check if the callee is a function expression (anonymous function)
        if (node.callee.type === 'FunctionExpression') {
          context.report({
            node,
            messageId: 'callOnAnonymousFunctionNotPermitted',
            // No automatic fix possible as it requires significant refactoring
            // to add proper type information
          });
        }
      },
    };
  },
};

export default rule;
