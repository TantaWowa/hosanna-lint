import { Rule } from 'eslint';

// Array methods that are not supported in Hosanna/BrightScript
const UNSUPPORTED_ARRAY_METHODS = new Set([
  'find',
  'findIndex',
  'findLast',
  'findLastIndex',
  'flat',
  'flatMap',
  'includes',
  'some',
  'every',
  'reduceRight',
  'from',
  'of',
  'copyWithin',
  'fill',
  'entries',
  'keys',
  'values'
]);

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow unsupported Array methods in Hosanna',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      unsupportedArrayMethod: 'Array method "{{method}}" is not supported in Hosanna/BrightScript.',
    },
  },
  create: function (context) {
    return {
      CallExpression: function (node) {
        // Check for Array.method() calls
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier' &&
          node.callee.object.name === 'Array' &&
          node.callee.property.type === 'Identifier'
        ) {
          const methodName = node.callee.property.name;
          if (UNSUPPORTED_ARRAY_METHODS.has(methodName)) {
            context.report({
              node: node.callee.property,
              messageId: 'unsupportedArrayMethod',
              data: { method: methodName },
            });
          }
        }

        // Check for arrayInstance.method() calls on arrays
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.property.type === 'Identifier'
        ) {
          const methodName = node.callee.property.name;
          if (UNSUPPORTED_ARRAY_METHODS.has(methodName)) {
            // Check if the object is likely an array by checking its type annotation or usage
            const object = node.callee.object;
            if (isLikelyArray(object, context)) {
              context.report({
                node: node.callee.property,
                messageId: 'unsupportedArrayMethod',
                data: { method: methodName },
              });
            }
          }
        }
      },
    };
  },
};

// Helper function to determine if an expression is likely an array
function isLikelyArray(node: any, context: any): boolean {
  // Check for array literals
  if (node.type === 'ArrayExpression') {
    return true;
  }

  // Check for variable references that are declared as arrays
  if (node.type === 'Identifier') {
    const scope = (context as any).sourceCode.getScope(node);
    const variable = scope.variables.find((v: any) => v.name === node.name);
    if (variable && variable.defs.length > 0) {
      const def = variable.defs[0];
      // Check if it's declared with array type annotation
      if (def.node.type === 'VariableDeclarator' && def.node.id.typeAnnotation) {
        const typeAnnotation = def.node.id.typeAnnotation;
        if (isArrayTypeAnnotation(typeAnnotation)) {
          return true;
        }
      }
      // Check if initialized with array literal
      if (def.node.type === 'VariableDeclarator' && def.node.init && def.node.init.type === 'ArrayExpression') {
        return true;
      }
    }
  }

  // Check for array access patterns (array[index])
  if (node.type === 'MemberExpression' && node.computed === true) {
    return isLikelyArray(node.object, context);
  }

  return false;
}

// Helper function to check if a type annotation represents an array
function isArrayTypeAnnotation(typeAnnotation: any): boolean {
  if (!typeAnnotation || !typeAnnotation.typeAnnotation) {
    return false;
  }

  const type = typeAnnotation.typeAnnotation;
  return type.type === 'TSArrayType' ||
         (type.type === 'TSTypeReference' &&
          type.typeName.type === 'Identifier' &&
          type.typeName.name === 'Array');
}

export default rule;
