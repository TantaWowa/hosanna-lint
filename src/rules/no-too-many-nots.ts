import { Rule } from 'eslint';

const MAX_SEQUENTIAL_NOTS = 3;

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: `HS-1060: Disallow more than ${MAX_SEQUENTIAL_NOTS} sequential ! operators. BrightScript does not support deeply chained negations.`,
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      tooManyNots:
        `HS-1060: More than ${MAX_SEQUENTIAL_NOTS} sequential ! operators is not supported in BrightScript. Simplify the expression.`,
    },
  },
  create: function (context) {
    return {
      UnaryExpression: function (node) {
        if (node.operator !== '!') return;

        if (
          node.parent?.type === 'UnaryExpression' &&
          node.parent.operator === '!'
        ) {
          return;
        }

        let count = 1;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let current: any = node.argument;
        while (current.type === 'UnaryExpression' && current.operator === '!') {
          count++;
          current = current.argument;
        }

        if (count > MAX_SEQUENTIAL_NOTS) {
          context.report({ node, messageId: 'tooManyNots' });
        }
      },
    };
  },
};

export default rule;
