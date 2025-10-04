import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow await expressions as they are not supported in Hosanna',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      awaitNotSupported: 'Await expressions are not supported in Hosanna. Use Promise.then() instead.',
    },
  },
  create: function (context) {
    return {
      AwaitExpression: function (node) {
        context.report({
          node,
          messageId: 'awaitNotSupported',
          fix: (_fixer) => {
            // This is a complex transformation that would require analyzing the entire context
            // For now, we'll just report the issue without a fix
            // A proper fix would need to:
            // 1. Wrap the containing function in a Promise
            // 2. Convert await to .then()
            // 3. Handle return values properly
            // This is too complex for an automatic fix, so we'll just report
            return null;
          },
        });
      },
    };
  },
};

export default rule;
