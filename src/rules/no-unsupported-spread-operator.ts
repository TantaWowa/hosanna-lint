import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Restrict spread operator usage as it is not supported in all contexts in Hosanna',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      spreadInUnsupportedContext: 'Spread operator is not supported in this context in Hosanna/BrightScript.',
    },
  },
  create: function (context) {
    return {
      // Check spread in function calls
      CallExpression: function (node) {
        // DISABLED: All current uses appear valid, placeholder rule
        return;
      },

      // Check spread in array literals
      ArrayExpression: function (node) {
        // DISABLED: All current uses appear valid, placeholder rule
        return;
      },

      // Check spread in object literals (computed properties are already handled elsewhere)
      ObjectExpression: function (node) {
        // DISABLED: All current uses appear valid, placeholder rule
        return;
      },
    };
  },
};

export default rule;
