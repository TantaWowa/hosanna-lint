import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'HS-1038: Disallow Infinity usage. Infinity is not supported in BrightScript and is transpiled as MAXINT (2147483647).',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      infinityNotSupported:
        'HS-1038: Infinity is not supported in BrightScript and is transpiled as MAXINT (2147483647). Consider using 2147483647 directly if that is the intended behavior.',
    },
  },
  create: function (context) {
    return {
      Identifier: function (node) {
        if (node.name === 'Infinity' && node.parent?.type !== 'MemberExpression') {
          context.report({ node, messageId: 'infinityNotSupported' });
        }
      },
      MemberExpression: function (node) {
        if (
          node.object.type === 'Identifier' &&
          node.object.name === 'Number' &&
          node.property.type === 'Identifier' &&
          (node.property.name === 'POSITIVE_INFINITY' || node.property.name === 'NEGATIVE_INFINITY')
        ) {
          context.report({ node, messageId: 'infinityNotSupported' });
        }
      },
    };
  },
};

export default rule;
