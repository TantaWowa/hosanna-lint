import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow export aliasing (export =) as it is not supported in Hosanna',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      exportAliasingNotSupported: 'Export aliasing is not supported in Hosanna. Use named exports instead.',
    },
  },
  create: function (context) {
    return {
      TSExportAssignment: function (node) {
        // Check if this is export = (aliasing)
        if (node.isExportEquals) {
          context.report({
            node,
            messageId: 'exportAliasingNotSupported',
            fix: (_fixer) => {
              // For now, we can't provide an automatic fix as it would require
              // significant refactoring to convert export = to named exports
              // The user will need to manually convert to named exports
              return null;
            },
          });
        }
      },
    };
  },
};

export default rule;
