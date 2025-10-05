import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Restrict computed property keys in object literals as they are limited in Hosanna in this context',
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
    // Placeholder rule - does nothing for now
    // Later on, if we find contexts that cause it to fail we will document them
    return {};
  },
};

export default rule;
