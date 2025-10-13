import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow imports from generated files',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      noGeneratedImports: 'Do not import from generated files. These are auto-generated files that should not be imported directly.',
    },
  },
      create: function (context) {
        return {
          ImportDeclaration: function (node) {
            const source = node.source.value;
            if (typeof source === 'string' && ((source.startsWith('@hs-generated') && source !== '@hs-generated-async') || source.includes('-generated-struct'))) {
              context.report({
                node: node.source,
                messageId: 'noGeneratedImports',
              });
            }
          },
        };
      },
};

export default rule;
