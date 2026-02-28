import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'HS-1056: Disallow accessing static members via "this". Use ClassName.staticMember instead.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      staticMemberWithThis:
        'HS-1056: Unable to resolve class reference for static member access with "this". Use ClassName.{{member}} instead of this.{{member}} for static members.',
    },
  },
  create: function (context) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const classStaticMembers = new Map<any, Set<string>>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const classInstanceMembers = new Map<any, Set<string>>();

    return {
      ClassBody: function (node) {
        const statics = new Set<string>();
        const instanceMembers = new Set<string>();
        for (const member of node.body) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const m = member as any;
          if (m.key?.type !== 'Identifier') continue;
          const name = m.key.name;
          if (m.static) {
            statics.add(name);
          } else {
            instanceMembers.add(name);
          }
        }
        if (statics.size > 0) classStaticMembers.set(node, statics);
        if (instanceMembers.size > 0) classInstanceMembers.set(node, instanceMembers);
      },
      MemberExpression: function (node) {
        if (
          node.object.type !== 'ThisExpression' ||
          node.property.type !== 'Identifier'
        ) return;

        const memberName = node.property.name;

        // Walk up to find enclosing class body
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let current: any = node.parent;
        while (current) {
          if (current.type === 'ClassBody') {
            const statics = classStaticMembers.get(current);
            const instanceMembers = classInstanceMembers.get(current);
            // Only flag if it's a static member AND there is no instance member with the same name.
            // When both exist (e.g. static fromTimestamp + private fromTimestamp), this.member
            // resolves to the instance member, so we should not flag.
            if (
              statics?.has(memberName) &&
              !instanceMembers?.has(memberName)
            ) {
              context.report({
                node,
                messageId: 'staticMemberWithThis',
                data: { member: memberName },
              });
            }
            return;
          }
          current = current.parent;
        }
      },
    };
  },
};

export default rule;
