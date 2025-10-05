import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Restrict ++ and -- operators to only statements or property access expressions',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      incrementDecrementOnlyInStatements: '++ and -- are only allowed as statements, or on dotted gets (e.g. this.var++ or node.id++).',
    },
  },
  create: function (context) {
    return {
      UpdateExpression: function (node) {
        // Check if this is ++ or -- operator
        if (node.operator === '++' || node.operator === '--') {
          // Check if the parent is an ExpressionStatement (standalone statement)
          const isInExpressionStatement = node.parent && node.parent.type === 'ExpressionStatement';

          // Check if the operand is a property access (dotted get like obj.prop++)
          const isOnPropertyAccess = node.argument && node.argument.type === 'MemberExpression';

          // If neither condition is met, report an error
          if (!isInExpressionStatement && !isOnPropertyAccess) {
            context.report({
              node,
              messageId: 'incrementDecrementOnlyInStatements',
              fix: (fixer) => {
                // For now, we can't provide an automatic fix as it would require
                // significant refactoring to move the expression to a statement
                return null;
              },
            });
          }
        }
      },
    };
  },
};

export default rule;
