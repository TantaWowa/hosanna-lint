import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow Number.isNaN() as it is not supported in Hosanna',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      numberIsNaNNotSupported: 'Number.isNaN() is not supported in Hosanna/BrightScript. Use the global isNaN() function instead (note: isNaN() is unreliable).',
    },
  },
  create: function (context) {
    return {
      CallExpression: function (node) {
        // Check for Number.isNaN() calls
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier' &&
          node.callee.object.name === 'Number' &&
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'isNaN'
        ) {
          context.report({
            node: node.callee,
            messageId: 'numberIsNaNNotSupported',
            fix: (fixer) => {
              // Replace Number.isNaN(arg) with isNaN(arg)
              const args = node.arguments;
              if (args.length === 1) {
                const argText = context.getSourceCode().getText(args[0]);
                return fixer.replaceText(node, `isNaN(${argText})`);
              }
              return null;
            },
          });
        }
      },
    };
  },
};

export default rule;
