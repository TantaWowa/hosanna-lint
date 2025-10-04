import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Restrict computed property keys in object literals as they are limited in Hosanna',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      computedPropertyRestricted: 'Computed property keys in object literals are only supported for enums and literals. Refactor to use direct property access instead.',
    },
  },
  create: function (context) {
    return {
      Property: function (node) {
        // Check if this is a computed property (has [key] syntax)
        if (node.computed && node.key.type !== 'Literal' && node.key.type !== 'TemplateLiteral') {
          // Allow string/numeric literals and template literals
          // But disallow variables, expressions, etc.
          if (node.key.type === 'Identifier') {
            // Allow identifiers that are likely enum values
            // This is a heuristic - we'll allow identifiers for now
            // as they might be enum values which are supported
            return;
          }

          // Disallow other computed property types
          context.report({
            node: node.key,
            messageId: 'computedPropertyRestricted',
          });
        }
      },
    };
  },
};

export default rule;
