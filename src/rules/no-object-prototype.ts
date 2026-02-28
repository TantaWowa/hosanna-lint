import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'HS-1077: Disallow Object.prototype usage. Object.prototype functions and fields are not supported in BrightScript.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      objectPrototypeNotSupported:
        'HS-1077: Object.prototype functions and fields are not supported in BrightScript. Use direct object methods instead, e.g. obj.hasOwnProperty("key").',
    },
  },
  create: function (context) {
    return {
      MemberExpression: function (node) {
        if (
          node.object.type === 'Identifier' &&
          node.object.name === 'Object' &&
          node.property.type === 'Identifier' &&
          node.property.name === 'prototype'
        ) {
          context.report({ node, messageId: 'objectPrototypeNotSupported' });
        }
      },
    };
  },
};

export default rule;
