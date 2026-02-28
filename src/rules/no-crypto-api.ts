import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'HS-1086: Disallow Web/Node crypto API usage. Use HsCrypto instead.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      cryptoNotSupported:
        'HS-1086: Web/Node crypto API is not supported in BrightScript. Use HsCrypto instead (e.g. HsCrypto.getRandomValues, HsCrypto.sha256).',
    },
  },
  create: function (context) {
    return {
      MemberExpression: function (node) {
        if (
          node.object.type === 'Identifier' &&
          node.object.name === 'crypto'
        ) {
          context.report({ node, messageId: 'cryptoNotSupported' });
          return;
        }
        if (
          node.object.type === 'MemberExpression' &&
          node.object.object.type === 'Identifier' &&
          node.object.object.name === 'window' &&
          node.object.property.type === 'Identifier' &&
          node.object.property.name === 'crypto'
        ) {
          context.report({ node, messageId: 'cryptoNotSupported' });
        }
      },
    };
  },
};

export default rule;
