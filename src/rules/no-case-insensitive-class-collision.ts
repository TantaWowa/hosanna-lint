import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'HS-1020: Disallow case-insensitive class member naming collisions. BrightScript class methods and fields must be case-insensitively unique.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      caseInsensitiveCollision:
        'HS-1020: Case-insensitive class member naming collision detected for "{{member}}". The member "{{existing}}" already exists. Class methods and fields must be case-insensitively unique in BrightScript.',
    },
  },
  create: function (context) {
    return {
      ClassBody: function (node) {
        const memberMap = new Map<string, string>();

        for (const member of node.body) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const m = member as any;
          let name: string | null = null;
          if (m.key?.type === 'Identifier') {
            name = m.key.name;
          } else if (m.key?.type === 'Literal' && typeof m.key.value === 'string') {
            name = m.key.value;
          }

          if (!name) continue;

          const lowerName = name.toLowerCase();
          const existing = memberMap.get(lowerName);
          if (existing && existing !== name) {
            context.report({
              node: m.key,
              messageId: 'caseInsensitiveCollision',
              data: { member: name, existing },
            });
          } else {
            memberMap.set(lowerName, name);
          }
        }
      },
    };
  },
};

export default rule;
