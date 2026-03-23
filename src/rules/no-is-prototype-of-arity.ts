import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'HS-1049: isPrototypeOf expects exactly one argument.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      wrongArity:
        'HS-1049: isPrototypeOf expects exactly 1 argument, got {{count}}.',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== 'MemberExpression') return;
        const prop = callee.property;
        const name =
          !callee.computed && prop.type === 'Identifier'
            ? prop.name
            : callee.computed && prop.type === 'Literal' && typeof prop.value === 'string'
              ? prop.value
              : null;
        if (name !== 'isPrototypeOf') return;
        if (node.arguments.length === 1) return;
        context.report({
          node,
          messageId: 'wrongArity',
          data: { count: String(node.arguments.length) },
        });
      },
    };
  },
};

export default rule;
