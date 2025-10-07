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

  // Find the innermost function scope that contains this node
  let innermostFunctionScope: Scope.Scope | null = null;
  let scope: Scope.Scope | null = currentScope;
  while (scope) {
    if (scope.type === 'function') {
      innermostFunctionScope = scope;
      break;
    }
    scope = scope.upper;
  }

  // If we're not in any function scope, allow modifications
  if (!innermostFunctionScope) {
    return false;
  }

  // Check if the variable is declared within the innermost function scope
  scope = currentScope;
  while (scope) {
    const variable = scope.variables.find((v: Scope.Variable) => v.name === variableName);
    if (variable) {
      // Walk up from the declaration scope to see if we encounter the innermost function scope
      let checkScope: Scope.Scope | null = scope;
      while (checkScope) {
        if (checkScope === innermostFunctionScope) {
          // Variable is declared within the innermost function scope (or in it)
          return false;
        }
        checkScope = checkScope.upper;
      }
      // Variable is declared outside the innermost function scope
      return true;
    }
    scope = scope.upper;
  }

  // Variable not found
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
