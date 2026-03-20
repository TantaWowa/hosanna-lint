import { Rule } from 'eslint';
import { SUPPORTED_MATH_METHODS, SUPPORTED_MATH_PROPERTIES } from '@tantawowa/hosanna-supported-apis';

const SUPPORTED_MATH_METHOD_SET = new Set<string>(SUPPORTED_MATH_METHODS);
const SUPPORTED_MATH_PROPERTY_SET = new Set<string>(SUPPORTED_MATH_PROPERTIES);

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
          !SUPPORTED_MATH_METHOD_SET.has(node.callee.property.name)
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
          !SUPPORTED_MATH_METHOD_SET.has(node.property.name) &&
          !SUPPORTED_MATH_PROPERTY_SET.has(node.property.name) &&
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
