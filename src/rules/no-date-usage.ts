import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow Date usage as it is not supported in Hosanna',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      dateConstructorNotSupported: 'Date constructor is not supported in Hosanna. Use HsDate instead.',
      dateStaticMethodNotSupported: 'Date.{{method}} is not supported in Hosanna. Use HsDate instead.',
      dateTypeNotSupported: 'Type "Date" is not supported in Hosanna. Use "HsDate" instead.',
    },
  },
  create: function (context) {
    return {
      // Check for new Date() calls
      NewExpression: function (node) {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'Date'
        ) {
          context.report({
            node,
            messageId: 'dateConstructorNotSupported',
          });
        }
      },

      // Check for Date.staticMethod() calls
      CallExpression: function (node) {
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier' &&
          node.callee.object.name === 'Date' &&
          node.callee.property.type === 'Identifier'
        ) {
          const methodName = node.callee.property.name;

          context.report({
            node,
            messageId: 'dateStaticMethodNotSupported',
            data: {
              method: methodName,
            },
          });
        }
      },

      // Check for Date type annotations
      TSQualifiedName: function (node) {
        if (
          node.left.type === 'Identifier' &&
          node.left.name === 'Date'
        ) {
          context.report({
            node,
            messageId: 'dateTypeNotSupported',
          });
        }
      },

      // Check for Date in type references
      TSTypeReference: function (node) {
        if (
          node.typeName.type === 'Identifier' &&
          node.typeName.name === 'Date'
        ) {
          context.report({
            node,
            messageId: 'dateTypeNotSupported',
          });
        }
      },
    };
  },
};

export default rule;
