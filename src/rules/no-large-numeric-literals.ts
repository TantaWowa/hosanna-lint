import { Rule } from 'eslint';
import type { Node } from 'estree';

// Maximum safe integer for Roku/BrightScript
const MAX_ROKU_SAFE_INT = 2147483647;

/**
 * Check if a node represents a roLongInteger type reference
 */
function isRoLongIntegerType(node: Node): boolean {
  if (!node) return false;

  // Check for TSTypeReference like 'roLongInteger'
  if (node.type === 'TSTypeReference' && node.typeName) {
    if (node.typeName.type === 'Identifier' && node.typeName.name === 'roLongInteger') {
      return true;
    }
  }

  // Check for TSQualifiedName like 'roku.roLongInteger'
  if (node.type === 'TSQualifiedName' &&
      node.left && node.left.name === 'roku' &&
      node.right && node.right.name === 'roLongInteger') {
    return true;
  }

  return false;
}

/**
 * Check if a literal node is explicitly typed as roLongInteger
 */
function isExplicitlyTypedAsRoLongInteger(node: Node): boolean {
  if (!node || !node.parent) return false;

  // Check for 'as roLongInteger' expressions
  if (node.parent.type === 'TSAsExpression') {
    return isRoLongIntegerType(node.parent.typeAnnotation);
  }

  // Check for variable declarations with type annotations
  if (node.parent.type === 'VariableDeclarator' && node.parent.id && node.parent.id.typeAnnotation) {
    return isRoLongIntegerType(node.parent.id.typeAnnotation.typeAnnotation);
  }

  // Check for property declarations with type annotations
  if (node.parent.type === 'PropertyDefinition' && node.parent.typeAnnotation) {
    return isRoLongIntegerType(node.parent.typeAnnotation);
  }

  // Check for parameter type annotations in function declarations
  if (node.parent.type === 'AssignmentPattern' && node.parent.left && node.parent.left.typeAnnotation) {
    return isRoLongIntegerType(node.parent.left.typeAnnotation.typeAnnotation);
  }

  return false;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Warn about numeric literals that exceed Roku\'s maximum safe integer',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      numericLiteralExceedsMaxRokuSafeInt: 'Numeric literal {{value}} will be cast as roLongInteger.',
    },
  },
  create: function (context) {
    return {
      Literal: function (node) {
        // Check for numeric literals
        if (typeof node.value === 'number' && Number.isInteger(node.value)) {
          if (node.value > MAX_ROKU_SAFE_INT) {
            // Skip if explicitly typed as roLongInteger
            if (isExplicitlyTypedAsRoLongInteger(node)) {
              return;
            }

            context.report({
              node,
              messageId: 'numericLiteralExceedsMaxRokuSafeInt',
              data: { value: node.value.toString() },
            });
          }
        }
      },
    };
  },
};

export default rule;
