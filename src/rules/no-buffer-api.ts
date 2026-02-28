import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'HS-1085: Disallow Node.js Buffer API usage. Buffer is not supported in BrightScript; use HsCrypto instead.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      bufferNotSupported:
        'HS-1085: Node.js Buffer API is not supported in BrightScript. Use HsCrypto instead (e.g. HsCrypto.base64Decode, HsCrypto.base64Encode, HsCrypto.sha256).',
    },
  },
  create: function (context) {
    return {
      Identifier: function (node) {
        if (node.name !== 'Buffer') return;

        const parent = node.parent;
        if (!parent) return;

        if (parent.type === 'ImportDeclaration' || parent.type === 'ImportSpecifier') return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parentType = (parent as any).type;
        if (
          parentType === 'MemberExpression' && (parent as Rule.Node & { object: Rule.Node }).object === node ||
          parentType === 'NewExpression' && (parent as Rule.Node & { callee: Rule.Node }).callee === node ||
          parentType === 'CallExpression' && (parent as Rule.Node & { callee: Rule.Node }).callee === node ||
          parentType === 'TSTypeReference'
        ) {
          context.report({ node, messageId: 'bufferNotSupported' });
        }
      },
    };
  },
};

export default rule;
