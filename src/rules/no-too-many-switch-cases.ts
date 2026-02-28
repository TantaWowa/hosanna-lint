import { Rule } from 'eslint';

const MAX_SWITCH_CASES = 255;

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: `HS-1003: Disallow switch statements exceeding ${MAX_SWITCH_CASES} cases. BrightScript only supports up to ${MAX_SWITCH_CASES} switch cases.`,
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      tooManySwitchCases:
        `HS-1003: Too many switch cases ({{count}}). BrightScript only supports up to ${MAX_SWITCH_CASES} switch cases.`,
    },
  },
  create: function (context) {
    return {
      SwitchStatement: function (node) {
        const count = node.cases.length;
        if (count > MAX_SWITCH_CASES) {
          context.report({
            node,
            messageId: 'tooManySwitchCases',
            data: { count: String(count) },
          });
        }
      },
    };
  },
};

export default rule;
