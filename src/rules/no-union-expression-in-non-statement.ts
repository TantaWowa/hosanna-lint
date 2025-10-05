import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Restrict ++ and -- operators to only statements, property access expressions, or for loop update clauses',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      incrementDecrementOnlyInStatements: '++ and -- are only allowed as statements, on dotted gets (e.g. this.var++ or node.id++), or in for loop update clauses.',
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

          // Check if this is part of a for statement's update clause
          const isInForStatementUpdate = node.parent && node.parent.type === 'ForStatement' &&
            node.parent.update === node;

          // If none of the allowed conditions are met, report an error
          if (!isInExpressionStatement && !isOnPropertyAccess && !isInForStatementUpdate) {
            context.report({
              node,
              messageId: 'incrementDecrementOnlyInStatements',
              fix: (_fixer) => {
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
