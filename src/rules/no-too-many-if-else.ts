import { Rule } from 'eslint';

const MAX_IF_ELSE_CLAUSES = 250;

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: `HS-1002: Disallow if-else chains exceeding ${MAX_IF_ELSE_CLAUSES} clauses. BrightScript only supports up to ${MAX_IF_ELSE_CLAUSES} if-else clauses.`,
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      tooManyIfElseClauses:
        `HS-1002: Too many if-else clauses ({{count}}). BrightScript only supports up to ${MAX_IF_ELSE_CLAUSES} if-else clauses.`,
    },
  },
  create: function (context) {
    return {
      IfStatement: function (node) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((node as any).parent?.type === 'IfStatement') {
          return;
        }

        let count = 1;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let current: any = node;
        while (current.alternate) {
          if (current.alternate.type === 'IfStatement') {
            count++;
            current = current.alternate;
          } else {
            count++;
            break;
          }
        }

        if (count > MAX_IF_ELSE_CLAUSES) {
          context.report({
            node,
            messageId: 'tooManyIfElseClauses',
            data: { count: String(count) },
          });
        }
      },
    };
  },
};

export default rule;
