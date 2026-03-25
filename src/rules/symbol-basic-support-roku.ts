import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Warn when using Symbol() — Hosanna transpiles it to hs_symbol() returning a string on Roku, not a unique symbol.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      symbolBasicSupportOnRoku:
        'HS-1117: SymbolBasicSupportOnRoku: Symbol only has basic support on Roku; this will be interpreted as a string.',
    },
  },
  create: function (context) {
    return {
      CallExpression: function (node) {
        if (
          node.callee.type === 'Identifier' &&
          'name' in node.callee &&
          node.callee.name === 'Symbol'
        ) {
          context.report({
            node,
            messageId: 'symbolBasicSupportOnRoku',
          });
        }
      },
    };
  },
};

export default rule;
