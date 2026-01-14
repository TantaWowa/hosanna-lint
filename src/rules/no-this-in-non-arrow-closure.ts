import { Rule } from 'eslint';

/**
 * Check if a function expression is used as a closure (assigned to variable/property,
 * passed as argument, returned, or in array)
 */
function isFunctionExpressionClosure(node: Rule.Node): boolean {
  if (!node.parent) {
    return false;
  }

  const parent = node.parent as Rule.Node;

  // Assigned to variable: const fn = function() {}
  if (parent.type === 'VariableDeclarator') {
    return true;
  }

  // Assigned to property: obj.fn = function() {}
  if (parent.type === 'AssignmentExpression') {
    const assignmentParent = parent as any;
    if (assignmentParent.right === node) {
      return true;
    }
  }

  // Object property value (but NOT method definition): { fn: function() {} }
  if (parent.type === 'Property') {
    const propertyParent = parent.parent;
    if (propertyParent && propertyParent.type === 'ObjectExpression') {
      // Skip if this is a method definition (method shorthand or computed method)
      const propertyParentNode = propertyParent as any;
      if ((parent as any).method === true) {
        return false;
      }
      return true;
    }
  }

  // Passed as argument: callFn(function() {})
  if (parent.type === 'CallExpression') {
    const callParent = parent as any;
    if (callParent.arguments && callParent.arguments.includes(node)) {
      return true;
    }
  }

  // Returned from function: return function() {}
  if (parent.type === 'ReturnStatement') {
    return true;
  }

  // In array: [function() {}]
  if (parent.type === 'ArrayExpression') {
    return true;
  }

  return false;
}

/**
 * Find the containing function (FunctionExpression or ArrowFunctionExpression)
 * by walking up the AST from a node
 */
function findContainingFunction(node: Rule.Node): Rule.Node | null {
  let current: Rule.Node | null = node;
  while (current) {
    if (current.type === 'FunctionExpression' || current.type === 'ArrowFunctionExpression') {
      return current;
    }
    current = current.parent as Rule.Node | null;
  }
  return null;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow this usage in non-arrow function expressions that will become closures',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      thisInNonArrowClosure: 'this cannot be reliably used in non-arrow function closures. Use an arrow function () => {} or capture this explicitly: const self = this;',
    },
  },
  create: function (context) {
    return {
      ThisExpression: function (node) {
        // Find the containing function
        const containingFunction = findContainingFunction(node);
        if (!containingFunction) {
          return; // Not inside any function
        }

        // Only flag FunctionExpression, not ArrowFunctionExpression
        if (containingFunction.type !== 'FunctionExpression') {
          return; // Arrow functions preserve lexical this, so they're OK
        }

        // Check if this function expression is a method definition
        // Method definitions are not closures, so they're OK
        if (containingFunction.parent && (containingFunction.parent as Rule.Node).type === 'MethodDefinition') {
          return;
        }

        // Check if the function expression is used as a closure
        if (isFunctionExpressionClosure(containingFunction)) {
          context.report({
            node,
            messageId: 'thisInNonArrowClosure',
          });
        }
      },
    };
  },
};

export default rule;
