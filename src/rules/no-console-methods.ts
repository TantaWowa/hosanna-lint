import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow console methods as they are not supported in Hosanna',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      consoleMethodNotSupported: 'Console method "{{method}}" is not supported in Hosanna.',
    },
  },
  create: function (context) {
    return {
      CallExpression: function (node) {
        // Check if this is a console method call
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier' &&
          node.callee.object.name === 'console' &&
          node.callee.property.type === 'Identifier'
        ) {
          const methodName = node.callee.property.name;

          context.report({
            node,
            messageId: 'consoleMethodNotSupported',
            data: {
              method: methodName,
            },
            fix: (fixer) => {
              // Remove the console call entirely
              return fixer.remove(node);
            },
          });
        }
      },
    };
  },
};

export default rule;
