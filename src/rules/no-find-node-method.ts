import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'HS-1076: Discourage direct .findNode() usage. Import and use the findNode utility from utils instead to avoid Roku SceneGraph bugs.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      avoidFindNode:
        'HS-1076: Avoid using ".findNode()" directly. Import and use "findNode" from utils to avoid Roku SceneGraph bugs.',
    },
  },
  create: function (context) {
    return {
      CallExpression: function (node) {
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'findNode'
        ) {
          context.report({ node, messageId: 'avoidFindNode' });
        }
      },
    };
  },
};

export default rule;
