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
        'HS-1077: Object.prototype functions and fields are not supported in BrightScript.',
      hasOwnPropertyNotSupported:
        'HS-1077: hasOwnProperty() depends on Object.prototype and can crash on Roku associative arrays and arrays. Use Object.keys(obj).includes(key), an undefined check, or restructure the guard.',
    },
  },
  create: function (context) {
    return {
      MemberExpression: function (node) {
        if (
          !node.computed &&
          node.property.type === 'Identifier' &&
          node.property.name === 'hasOwnProperty'
        ) {
          context.report({ node, messageId: 'hasOwnPropertyNotSupported' });
          return;
        }

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
