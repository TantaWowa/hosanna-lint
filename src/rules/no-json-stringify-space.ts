import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow the "space" parameter of JSON.stringify (HS-1097). Pretty-printing is not supported on Roku devices and the option will be ignored at runtime.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      jsonStringifySpaceNotSupported:
        'HS-1097: JsonStringifySpaceNotSupported: The "space" parameter of JSON.stringify (for pretty-printing) is not supported on Roku devices. This option will be ignored at runtime.',
    },
  },
  create: function (context) {
    return {
      CallExpression: function (node) {
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier' &&
          node.callee.object.name === 'JSON' &&
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'stringify'
        ) {
          // JSON.stringify(value, replacer?, space?)
          // The 3rd argument is the space parameter - flag when present
          if (node.arguments.length >= 3) {
            context.report({
              node: node.arguments[2],
              messageId: 'jsonStringifySpaceNotSupported',
            });
          }
        }
      },
    };
  },
};

export default rule;
