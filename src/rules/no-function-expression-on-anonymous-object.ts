import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow function expressions on anonymous objects as they are not allowed in Hosanna',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      functionExpressionOnAnonymousObject: 'Function expressions are not allowed on anonymous objects in Hosanna. Use arrow functions or create a variable with the function definition first.',
    },
  },
  create: function (context) {
    return {
      Property: function (node) {
        // Check if this is a property in an object expression (anonymous object)
        if (node.parent.type === 'ObjectExpression') {
          // Case 1: method shorthand syntax - func() {}
          // Property nodes with method: true represent method shorthand
          if ((node as any).method === true) {
            context.report({
              node: node,
              messageId: 'functionExpressionOnAnonymousObject',
            });
            return;
          }

          // Case 2: function expression syntax - myfunc: function() {}
          // Check if the value is a function expression (non-arrow function)
          if (node.value.type === 'FunctionExpression') {
            context.report({
              node: node.value,
              messageId: 'functionExpressionOnAnonymousObject',
            });
          }
        }
      },
    };
  },
};

export default rule;
