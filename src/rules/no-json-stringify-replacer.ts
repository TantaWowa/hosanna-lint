import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'HS-1096: Disallow the "replacer" parameter of JSON.stringify. The replacer function is not supported on Roku devices.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      jsonStringifyReplacerNotSupported:
        'HS-1096: The "replacer" parameter of JSON.stringify is not supported on Roku devices. This option will be ignored at runtime.',
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
          node.callee.property.name === 'stringify' &&
          node.arguments.length >= 2
        ) {
          const replacerArg = node.arguments[1];
          if (replacerArg.type === 'Literal' && replacerArg.value === null) {
            return;
          }
          if (replacerArg.type === 'Identifier' && replacerArg.name === 'undefined') {
            return;
          }
          context.report({
            node: replacerArg,
            messageId: 'jsonStringifyReplacerNotSupported',
          });
        }
      },
    };
  },
};

export default rule;
