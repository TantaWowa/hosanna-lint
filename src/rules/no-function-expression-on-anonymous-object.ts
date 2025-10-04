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
        // and the value is a function expression
        if (
          node.parent.type === 'ObjectExpression' &&
          node.value.type === 'FunctionExpression'
        ) {
          context.report({
            node: node.value,
            messageId: 'functionExpressionOnAnonymousObject',
          });
        }
      },
    };
  },
};

export default rule;
