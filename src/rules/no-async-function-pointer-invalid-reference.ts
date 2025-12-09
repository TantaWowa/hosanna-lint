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
function isExportedFunctionDeclaration(node: any, context?: Rule.RuleContext): boolean {
  if (!node) return false;

  // Check if parent is ExportNamedDeclaration or ExportDefaultDeclaration
  if (node.parent) {
    if (node.parent.type === 'ExportNamedDeclaration' ||
        node.parent.type === 'ExportDefaultDeclaration') {
      return true;
    }
  }

  // If parent is not set and we have context, check top-level exports
  if (context && node.type === 'FunctionDeclaration' && node.id) {
    try {
      const functionName = node.id.name;
      const ast = context.sourceCode.ast;

      // Check top-level body for export declarations
      if (ast.body && Array.isArray(ast.body)) {
        for (const statement of ast.body) {
          // Check if it's an export declaration that exports this function
          if (statement.type === 'ExportNamedDeclaration') {
            // Direct export: export function name() {}
            if (statement.declaration &&
                statement.declaration.type === 'FunctionDeclaration' &&
                statement.declaration.id &&
                statement.declaration.id.name === functionName) {
              // If the function name matches, it's exported (same name = same function)
              return true;
            }
            // Named export: export { name }
            if (statement.specifiers && Array.isArray(statement.specifiers)) {
              for (const spec of statement.specifiers) {
                if (spec.type === 'ExportSpecifier' && spec.exported) {
                  // exported can be Identifier or Literal
                  const exportedName = spec.exported.type === 'Identifier'
                    ? spec.exported.name
                    : (spec.exported.type === 'Literal' && typeof spec.exported.value === 'string'
                        ? spec.exported.value
                        : null);
                  if (exportedName === functionName) {
                    return true;
                  }
                }
              }
            }
          }
          // Default export: export default function name() {}
          if (statement.type === 'ExportDefaultDeclaration' &&
              statement.declaration &&
              statement.declaration.type === 'FunctionDeclaration' &&
              statement.declaration.id &&
              statement.declaration.id.name === functionName) {
            return true;
          }
        }
      }
    } catch (e) {
      // If we can't check, fall back to parent check result
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
    let scope: import('eslint').Scope.Scope | null = context.sourceCode.getScope(node);

    // Walk up scopes to find the variable definition
    // This is important when we're inside nested scopes (like class methods)
    let variable: import('eslint').Scope.Variable | undefined;
    while (scope) {
      variable = scope.variables.find(
        (v: import('eslint').Scope.Variable) => v.name === node.name
      );
      if (variable && variable.defs.length > 0) {
        break;
      }
      scope = scope.upper;
    }

    if (variable && variable.defs.length > 0) {
      // Check all definitions - if ANY of them is valid, the identifier is valid
      let foundValidExport = false;

      for (const def of variable.defs) {
        // Allow imported bindings - we can't verify cross-module, so treat as valid
        if (def.type === 'ImportBinding') {
          return false; // Valid - imported functions are allowed
        }

        const defNode = def.node as any;
        if (!defNode) {
          continue;
        }

        // Handle ExportNamedDeclaration - the function is inside the declaration
        // This happens when we have: export function name() {}
        if (defNode.type === 'ExportNamedDeclaration') {
          if (defNode.declaration && defNode.declaration.type === 'FunctionDeclaration') {
            // This is an exported function declaration - valid
            foundValidExport = true;
            continue; // Check other definitions too, but mark this as valid
          }
          // Also check if it's exported via export { name } syntax
          if (defNode.specifiers && Array.isArray(defNode.specifiers)) {
            // This is a named export - check if any specifier matches
            for (const spec of defNode.specifiers) {
              if (spec.type === 'ExportSpecifier') {
                const exportedName = spec.exported?.type === 'Identifier'
                  ? spec.exported.name
                  : (spec.exported?.type === 'Literal' && typeof spec.exported.value === 'string'
                      ? spec.exported.value
                      : null);
                const localName = spec.local?.type === 'Identifier'
                  ? spec.local.name
                  : (spec.local?.type === 'Literal' && typeof spec.local.value === 'string'
                      ? spec.local.value
                      : null);
                // If the exported or local name matches our identifier, it's exported
                if (exportedName === node.name || localName === node.name) {
                  foundValidExport = true;
                  break;
                }
              }
            }
          }
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
          // First check if parent is ExportNamedDeclaration (fast path)
          if (defNode.parent &&
              (defNode.parent.type === 'ExportNamedDeclaration' ||
               defNode.parent.type === 'ExportDefaultDeclaration')) {
            // This is an exported function declaration - valid
            foundValidExport = true;
            continue;
          }

          // Also check if defNode itself is an ExportNamedDeclaration's declaration
          // This can happen when scope returns the FunctionDeclaration directly
          if (defNode.id && defNode.id.name) {
            const functionName = defNode.id.name;

            // Quick check: search AST for any export of a function with this name
            try {
              const ast = context.sourceCode.ast;
              if (ast.body && Array.isArray(ast.body)) {
                for (const statement of ast.body) {
                  if (statement.type === 'ExportNamedDeclaration') {
                    // Check if it exports a function with this name
                    if (statement.declaration &&
                        statement.declaration.type === 'FunctionDeclaration' &&
                        statement.declaration.id &&
                        statement.declaration.id.name === functionName) {
                      foundValidExport = true;
                      break;
                    }
                    // Check named exports
                    if (statement.specifiers) {
                      for (const spec of statement.specifiers) {
                        if (spec.type === 'ExportSpecifier') {
                          const exportedName = spec.exported?.type === 'Identifier'
                            ? spec.exported.name
                            : (spec.exported?.type === 'Literal' && typeof spec.exported.value === 'string'
                                ? spec.exported.value
                                : null);
                          if (exportedName === functionName) {
                            foundValidExport = true;
                            break;
                          }
                        }
                      }
                    }
                  }
                  if (statement.type === 'ExportDefaultDeclaration' &&
                      statement.declaration &&
                      statement.declaration.type === 'FunctionDeclaration' &&
                      statement.declaration.id &&
                      statement.declaration.id.name === functionName) {
                    foundValidExport = true;
                    break;
                  }
                }
              }
            } catch (e) {
              // Fall back to helper function if AST search fails
              if (isExportedFunctionDeclaration(defNode, context)) {
                foundValidExport = true;
              }
            }
          }

          // If we get here, this definition is not exported
          // But don't return yet - check other definitions first
        }
      }

      // If we found at least one valid export, the identifier is valid
      if (foundValidExport) {
        return false;
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
      invalidAsyncFunctionPointer: 'AsyncFunctionPointer must only accept exported function declarations. Cannot use class methods, anonymous functions, arrow functions, inline functions, or .bind() calls.',
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

