import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Computed property keys in object literals emit slower code on Roku than literal keys',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      computedPropertyInObjectLiteral: 'Computed property keys in object literals emit slower code on Roku than literal keys. For better performance, prefer literal keys or enum values when possible. Use //hs: disable-next-line to suppress.',
    },
  },
  create: function (context) {
    return {
      Property: function (node) {
        // Check if this is a computed property in an object literal
        if (node.computed && node.parent.type === 'ObjectExpression') {
          // Check if the computed key is NOT an enum reference or literal
          const keyExpr = node.key;

          // Allow literals (strings, numbers)
          if (keyExpr.type === 'Literal') {
            return;
          }

          // Allow member expressions that look like enum references (e.g., MyEnum.Value)
          if (keyExpr.type === 'MemberExpression' &&
              keyExpr.object.type === 'Identifier' &&
              keyExpr.property.type === 'Identifier') {
            // This could be an enum reference like MyEnum.Value - allow it
            return;
          }

          // For anything else (variables, complex expressions), flag it
          context.report({
            node: node.key,
            messageId: 'computedPropertyInObjectLiteral',
          });
        }
      },
    };
  },
};

export default rule;
