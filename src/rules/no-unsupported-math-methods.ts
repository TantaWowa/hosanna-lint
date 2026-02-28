import { Rule } from 'eslint';

const SUPPORTED_MATH_METHODS = new Set([
  'abs', 'atan', 'sin', 'cos', 'tan', 'exp', 'sqrt', 'log', 'random', 'sign',
  'min', 'max', 'pow', 'round', 'ceil', 'floor',
  'asin', 'acos', 'atan2', 'cbrt', 'trunc', 'fround', 'imul',
  'hypot', 'log10', 'log2', 'expm1', 'log1p', 'clz32',
  'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh',
]);

const SUPPORTED_MATH_PROPERTIES = new Set([
  'PI', 'E', 'LN2', 'LN10', 'LOG2E', 'LOG10E', 'SQRT2', 'SQRT1_2',
]);

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'HS-1108: Disallow unsupported Math methods in Hosanna/BrightScript.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      unsupportedMathMethod:
        'HS-1108: Math.{{name}} is not supported in Hosanna/BrightScript.',
    },
  },
  create: function (context) {
    return {
      CallExpression: function (node) {
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier' &&
          node.callee.object.name === 'Math' &&
          node.callee.property.type === 'Identifier' &&
          !SUPPORTED_MATH_METHODS.has(node.callee.property.name)
        ) {
          context.report({
            node: node.callee.property,
            messageId: 'unsupportedMathMethod',
            data: { name: node.callee.property.name },
          });
        }
      },
      MemberExpression: function (node) {
        if (
          node.object.type === 'Identifier' &&
          node.object.name === 'Math' &&
          node.property.type === 'Identifier' &&
          !SUPPORTED_MATH_METHODS.has(node.property.name) &&
          !SUPPORTED_MATH_PROPERTIES.has(node.property.name) &&
          node.parent?.type !== 'CallExpression'
        ) {
          context.report({
            node: node.property,
            messageId: 'unsupportedMathMethod',
            data: { name: node.property.name },
          });
        }
      },
    };
  },
};

export default rule;
