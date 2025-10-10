import { Rule } from 'eslint';

/**
 * Check if a type annotation represents the 'any' type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isAnyType(typeAnnotation: any): boolean {
  if (!typeAnnotation) return false;

  // Check for TSAnyKeyword (direct 'any' type)
  if (typeAnnotation.type === 'TSAnyKeyword') {
    return true;
  }

  // Check for TSTypeReference like 'any'
  if (typeAnnotation.type === 'TSTypeReference' && typeAnnotation.typeName) {
    if (typeAnnotation.typeName.type === 'Identifier' && typeAnnotation.typeName.name === 'any') {
      return true;
    }
  }

  return false;
}

/**
 * Get the root identifier from a chain of MemberExpressions
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getRootIdentifier(node: any): any {
  if (node.type === 'Identifier') {
    return node;
  }
  if (node.type === 'MemberExpression') {
    return getRootIdentifier(node.object);
  }
  return null;
}

/**
 * Check if an identifier is explicitly typed as 'any'
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isExplicitlyTypedAsAny(node: any, context: Rule.RuleContext): boolean {
  if (!node) return false;

  // If this is an identifier, check its declaration/definition
  if (node.type === 'Identifier') {
    const scope = context.sourceCode.getScope(node);
    const variable = scope.variables.find((v: any) => v.name === node.name);
    if (variable && variable.defs.length > 0) {
      const def = variable.defs[0];

      // Check for variable declarations with type annotations
      if (def.node.type === 'VariableDeclarator' && def.node.id && def.node.id.typeAnnotation) {
        return isAnyType(def.node.id.typeAnnotation.typeAnnotation);
      }

      // Check if initialized with 'as any' expression
      if (def.node.type === 'VariableDeclarator' && def.node.init && def.node.init.type === 'TSAsExpression') {
        return isAnyType(def.node.init.typeAnnotation);
      }

      // Check for property declarations with type annotations
      if (def.node.type === 'PropertyDefinition' && def.node.typeAnnotation) {
        return isAnyType(def.node.typeAnnotation);
      }
    }
  }

  // Fallback: check parent relationships (for inline cases)
  if (!node.parent) return false;

  // Check for 'as any' expressions
  if (node.parent.type === 'TSAsExpression') {
    return isAnyType(node.parent.typeAnnotation);
  }

  // Check for parameter type annotations in function declarations
  if (node.parent.type === 'AssignmentPattern' && node.parent.left && node.parent.left.typeAnnotation) {
    return isAnyType(node.parent.left.typeAnnotation.typeAnnotation);
  }

  return false;
}

/**
 * Check if a node represents a literal that cannot be meaningfully used with unary operators,
 * or is typed as 'any'
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isIllegalUnaryOperand(node: any, context: Rule.RuleContext): boolean {
  if (!node) return false;

  // Fast check: String literals
  if (node.type === 'Literal' && typeof node.value === 'string') {
    return true;
  }

  // Fast check: Boolean literals
  if (node.type === 'Literal' && typeof node.value === 'boolean') {
    return true;
  }

  // Fast check: Object literals
  if (node.type === 'ObjectExpression') {
    return true;
  }

  // Fast check: Array literals
  if (node.type === 'ArrayExpression') {
    return true;
  }

  // Fast check: Null literal
  if (node.type === 'Literal' && node.value === null) {
    return true;
  }

  // Check for MemberExpressions where the root identifier is typed as 'any'
  if (node.type === 'MemberExpression') {
    const rootIdentifier = getRootIdentifier(node);
    if (rootIdentifier) {
      return isExplicitlyTypedAsAny(rootIdentifier, context);
    }
  }

  // Expensive check: Only for identifiers, check if typed as 'any'
  if (node.type === 'Identifier') {
    return isExplicitlyTypedAsAny(node, context);
  }

  return false;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow unary operators on illegal or vague types',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      unaryOnIllegalType: 'Unary operator "{{operator}}" cannot be used on {{type}} as it may result in unexpected behavior or is not supported in Hosanna.',
    },
  },
  create: function (context) {
    return {
      UnaryExpression: function (node) {
        const operator = node.operator;

        // Only check for +, -, ~ operators (the ones that do type conversion)
        if (operator === '+' || operator === '-' || operator === '~') {
          if (isIllegalUnaryOperand(node.argument, context)) {
            let typeDescription = 'this type';
            if (node.argument.type === 'Literal') {
              if (typeof node.argument.value === 'string') {
                typeDescription = 'string literals';
              } else if (typeof node.argument.value === 'boolean') {
                typeDescription = 'boolean literals';
              } else if (node.argument.value === null) {
                typeDescription = 'null';
              }
            } else if (node.argument.type === 'ObjectExpression') {
              typeDescription = 'object literals';
            } else if (node.argument.type === 'ArrayExpression') {
              typeDescription = 'array literals';
            } else if (node.argument.type === 'MemberExpression') {
              const rootIdentifier = getRootIdentifier(node.argument);
              if (rootIdentifier && isExplicitlyTypedAsAny(rootIdentifier, context)) {
                typeDescription = 'any type';
              }
            } else if (node.argument.type === 'Identifier' && isExplicitlyTypedAsAny(node.argument, context)) {
              typeDescription = 'any type';
            }

            context.report({
              node,
              messageId: 'unaryOnIllegalType',
              data: {
                operator,
                type: typeDescription,
              },
            });
          }
        }
      },
    };
  },
};

export default rule;
