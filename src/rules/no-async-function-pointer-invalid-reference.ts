import { Rule } from 'eslint';

/**
 * Check if a type annotation represents AsyncFunctionPointer
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isAsyncFunctionPointerType(typeAnnotation: any): boolean {
  if (!typeAnnotation) return false;

  // Check for TSTypeReference like 'AsyncFunctionPointer'
  if (typeAnnotation.type === 'TSTypeReference' && typeAnnotation.typeName) {
    if (typeAnnotation.typeName.type === 'Identifier' &&
        typeAnnotation.typeName.name === 'AsyncFunctionPointer') {
      return true;
    }
  }

  return false;
}

/**
 * Check if a node has AsyncFunctionPointer type annotation
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hasAsyncFunctionPointerType(node: any): boolean {
  if (!node) return false;

  // Check for type annotation on variable declarator
  if (node.type === 'VariableDeclarator' && node.id && node.id.typeAnnotation) {
    return isAsyncFunctionPointerType(node.id.typeAnnotation.typeAnnotation);
  }

  // Check for type annotation on function parameter
  if (node.typeAnnotation) {
    return isAsyncFunctionPointerType(node.typeAnnotation.typeAnnotation);
  }

  return false;
}

/**
 * Check if a function declaration is exported
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isExportedFunctionDeclaration(node: any): boolean {
  if (!node) return false;

  // Check if parent is ExportNamedDeclaration or ExportDefaultDeclaration
  if (node.parent) {
    if (node.parent.type === 'ExportNamedDeclaration' ||
        node.parent.type === 'ExportDefaultDeclaration') {
      return true;
    }
  }

  return false;
}


/**
 * Check if a value node is invalid for AsyncFunctionPointer
 * Returns true if invalid (should be reported), false if valid
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isInvalidAsyncFunctionPointerValue(node: any, context: Rule.RuleContext): boolean {
  if (!node) return false;

  // Reject arrow functions
  if (node.type === 'ArrowFunctionExpression') {
    return true;
  }

  // Reject function expressions (anonymous or named inline functions)
  if (node.type === 'FunctionExpression') {
    return true;
  }

  // Reject class or object methods accessed via member expressions
  if (node.type === 'MemberExpression') {
    return true;
  }

  // For identifiers, inspect what they reference
  if (node.type === 'Identifier') {
    const scope = context.sourceCode.getScope(node);
    const variable = scope.variables.find(
      (v: import('eslint').Scope.Variable) => v.name === node.name
    );

    if (variable && variable.defs.length > 0) {
      for (const def of variable.defs) {
        // Allow imported bindings - we can't verify cross-module, so treat as valid
        if (def.type === 'ImportBinding') {
          return false;
        }

        const defNode = def.node as any;
        if (!defNode) {
          continue;
        }

        // Reject if it's a class method
        if (defNode.type === 'MethodDefinition') {
          return true;
        }

        // Reject if it's a variable whose initializer is a function expression or arrow function
        if (defNode.type === 'VariableDeclarator') {
          if (defNode.init) {
            if (
              defNode.init.type === 'FunctionExpression' ||
              defNode.init.type === 'ArrowFunctionExpression'
            ) {
              return true;
            }
          }
        }

        // Reject direct function or arrow expressions
        if (
          defNode.type === 'FunctionExpression' ||
          defNode.type === 'ArrowFunctionExpression'
        ) {
          return true;
        }

        // For function declarations, only allow if they are exported
        if (defNode.type === 'FunctionDeclaration') {
          if (!isExportedFunctionDeclaration(defNode)) {
            return true;
          }

          // Exported function declaration is valid
          return false;
        }
      }
    }

    // If we can't determine, assume invalid to be safe
    return true;
  }

  // Reject all other types by default
  return true;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensure AsyncFunctionPointer only accepts exported function declarations',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      invalidAsyncFunctionPointer: 'AsyncFunctionPointer must only accept exported function declarations. Cannot use class methods, anonymous functions, arrow functions, or inline functions.',
    },
  },
  create: function (context) {
    return {
      // Check variable declarations
      VariableDeclarator: function (node) {
        if (hasAsyncFunctionPointerType(node)) {
          if (node.init && isInvalidAsyncFunctionPointerValue(node.init, context)) {
            context.report({
              node: node.init,
              messageId: 'invalidAsyncFunctionPointer',
            });
          }
        }
      },

      // Check class property initializers
      PropertyDefinition: function (node) {
        if (hasAsyncFunctionPointerType(node)) {
          // For class fields, the value is stored in `value`
          if (node.value && isInvalidAsyncFunctionPointerValue(node.value, context)) {
            context.report({
              node: node.value,
              messageId: 'invalidAsyncFunctionPointer',
            });
          }
        }
      },

      // Check assignment expressions
      AssignmentExpression: function (node) {
        // Check if left side has AsyncFunctionPointer type
        if (node.left && node.left.type === 'Identifier') {
          const leftIdentifier = node.left;
          const scope = context.sourceCode.getScope(leftIdentifier);
          const variable = scope.variables.find(
            (v: import('eslint').Scope.Variable) => v.name === leftIdentifier.name
          );

          if (variable && variable.defs.length > 0) {
            const def = variable.defs[0];
            if (def.node.type === 'VariableDeclarator' &&
                def.node.id &&
                def.node.id.typeAnnotation) {
              if (isAsyncFunctionPointerType(def.node.id.typeAnnotation.typeAnnotation)) {
                if (isInvalidAsyncFunctionPointerValue(node.right, context)) {
                  context.report({
                    node: node.right,
                    messageId: 'invalidAsyncFunctionPointer',
                  });
                }
              }
            }
          }
        }
      },

      // Check function parameters
      FunctionDeclaration: function (node) {
        if (node.params) {
          for (const param of node.params) {
            if (hasAsyncFunctionPointerType(param)) {
              // We can't check the actual value passed here, but we can check
              // if default values are invalid
              if (param.type === 'AssignmentPattern' &&
                  param.right &&
                  isInvalidAsyncFunctionPointerValue(param.right, context)) {
                context.report({
                  node: param.right,
                  messageId: 'invalidAsyncFunctionPointer',
                });
              }
            }
          }
        }
      },

      // Check arrow function parameters
      ArrowFunctionExpression: function (node) {
        if (node.params) {
          for (const param of node.params) {
            if (hasAsyncFunctionPointerType(param)) {
              if (param.type === 'AssignmentPattern' &&
                  param.right &&
                  isInvalidAsyncFunctionPointerValue(param.right, context)) {
                context.report({
                  node: param.right,
                  messageId: 'invalidAsyncFunctionPointer',
                });
              }
            }
          }
        }
      },

      // Check call expressions where AsyncFunctionPointer is passed
      CallExpression: function (node) {
        // Check arguments passed to functions
        if (node.arguments) {
          for (let i = 0; i < node.arguments.length; i++) {
            const arg = node.arguments[i];
            // Check if the corresponding parameter has AsyncFunctionPointer type
            if (node.callee && node.callee.type === 'Identifier') {
              const calleeIdentifier = node.callee;
              const scope = context.sourceCode.getScope(calleeIdentifier);
              const variable = scope.variables.find(
                (v: import('eslint').Scope.Variable) => v.name === calleeIdentifier.name
              );

              if (variable && variable.defs.length > 0) {
                const def = variable.defs[0];
                if (def.node.type === 'FunctionDeclaration' &&
                    def.node.params &&
                    def.node.params[i] &&
                    hasAsyncFunctionPointerType(def.node.params[i])) {
                  if (isInvalidAsyncFunctionPointerValue(arg, context)) {
                    context.report({
                      node: arg,
                      messageId: 'invalidAsyncFunctionPointer',
                    });
                  }
                }
              }
            }
          }
        }
      },
    };
  },
};

export default rule;

