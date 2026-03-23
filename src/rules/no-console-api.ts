import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'HS-1046: console APIs are not supported on Roku; avoid console.* calls.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      consoleNotSupported:
        'HS-1046: console function "{{method}}" is not supported in Hosanna / BrightScript.',
    },
  },
  create(context) {
    function getConsoleMethodName(callee: Rule.Node): string | null {
      if (callee.type !== 'MemberExpression') return null;
      const obj = callee.object;
      if (obj.type !== 'Identifier' || obj.name !== 'console') return null;
      if (!callee.computed && callee.property.type === 'Identifier') {
        return callee.property.name;
      }
      if (callee.computed && callee.property.type === 'Literal' && typeof callee.property.value === 'string') {
        return callee.property.value;
      }
      return null;
    }

    return {
      CallExpression(node) {
        const method = getConsoleMethodName(node.callee as Rule.Node);
        if (!method) return;
        context.report({
          node: node.callee as Rule.Node,
          messageId: 'consoleNotSupported',
          data: { method },
        });
      },
    };
  },
};

export default rule;
