import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallows TypeScript module declarations and blocks as they are not supported in Hosanna',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      tsModuleDeclarationNotSupported: 'TSModuleDeclaration is not supported in Hosanna/BrightScript.',
      tsModuleBlockNotSupported: 'TSModuleBlock is not supported in Hosanna/BrightScript.',
    },
  },
  create: function (context) {
    return {
      TSModuleDeclaration: function (node) {
        context.report({
          node,
          messageId: 'tsModuleDeclarationNotSupported',
        });
      },

      TSModuleBlock: function (node) {
        context.report({
          node,
          messageId: 'tsModuleBlockNotSupported',
        });
      },
    };
  },
};

export default rule;
