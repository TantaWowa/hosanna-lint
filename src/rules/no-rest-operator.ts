import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow rest operator as it is not supported in Hosanna/BrightScript',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      restOperatorNotSupported: 'Rest operator is not supported in Hosanna/BrightScript.',
    },
  },
  create: function (context) {
    return {
      // Check for rest elements in function parameters
      RestElement: function (node) {
        context.report({
          node,
          messageId: 'restOperatorNotSupported',
        });
      },

      // Check for rest elements in destructuring assignments
      // This is already covered by RestElement, but let's be explicit
      VariableDeclarator: function (node) {
        if (node.id.type === 'ArrayPattern') {
          for (const element of node.id.elements) {
            if (element && element.type === 'RestElement') {
              context.report({
                node: element,
                messageId: 'restOperatorNotSupported',
              });
            }
          }
        } else if (node.id.type === 'ObjectPattern') {
          for (const property of node.id.properties) {
            if (property.type === 'RestElement') {
              context.report({
                node: property,
                messageId: 'restOperatorNotSupported',
              });
            }
          }
        }
      },
    };
  },
};

export default rule;
