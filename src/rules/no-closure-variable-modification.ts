import { Rule, Scope } from 'eslint';

// Helper function to check if a variable is a closure variable
function isClosureVariable(variableName: string, context: Rule.RuleContext, node: Rule.Node): boolean {
  // Be more lenient in test files - allow common testing patterns
  const filename = context.filename || '';
  const isTestFile = filename.includes('.test.') || filename.includes('.spec.') || filename.includes('/__tests__/');

  if (isTestFile) {
    // In test files, allow modifications to variables declared in test suite scopes
    // This accommodates common patterns like describe/it blocks modifying shared state
    return false;
  }

  const currentScope = context.sourceCode.getScope(node);

  // Check if the variable is declared in the current scope or any outer scope
  let scope = currentScope;
  while (scope) {
    // Check if the variable is declared in this scope
    const variable = scope.variables.find((v: Scope.Variable) => v.name === variableName);
    if (variable) {
      // If it's declared in the current scope, it's not a closure variable
      return scope !== currentScope;
    }
    scope = scope.upper;
  }

  // Variable not found in any scope - this shouldn't happen for valid code
  return false;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Detects modification of closure variables within nested functions',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      closureVariableModification: 'Closure variables cannot be modified in Hosanna/BrightScript. If you need to do this, hoist this variable into an object, and modify the object property instead.',
    },
  },
  create: function (context) {
    return {
      // Check for assignments in nested functions
      AssignmentExpression: function (node) {
        let current = node.parent;
        const ancestors = [];
        while (current) {
          ancestors.push(current);
          current = current.parent;
        }

        const functionLikeAncestors = ancestors.filter((ancestor: Rule.Node) =>
          ancestor.type === 'FunctionDeclaration' ||
          ancestor.type === 'FunctionExpression' ||
          ancestor.type === 'ArrowFunctionExpression'
        );

        if (functionLikeAncestors.length > 1) {
          // We're in a nested function - check if this is modifying a closure variable
          if (node.left.type === 'Identifier') {
            if (isClosureVariable(node.left.name, context, node)) {
              context.report({
                node,
                messageId: 'closureVariableModification',
              });
            }
          }
        }
      },

      // Also check update expressions (++, --) in nested functions
      UpdateExpression: function (node) {
        let current = node.parent;
        const ancestors = [];
        while (current) {
          ancestors.push(current);
          current = current.parent;
        }

        const functionLikeAncestors = ancestors.filter((ancestor: Rule.Node) =>
          ancestor.type === 'FunctionDeclaration' ||
          ancestor.type === 'FunctionExpression' ||
          ancestor.type === 'ArrowFunctionExpression'
        );

        if (functionLikeAncestors.length > 1) {
          if (node.argument.type === 'Identifier') {
            if (isClosureVariable(node.argument.name, context, node)) {
              context.report({
                node,
                messageId: 'closureVariableModification',
              });
            }
          }
        }
      },
    };
  },
};

export default rule;
