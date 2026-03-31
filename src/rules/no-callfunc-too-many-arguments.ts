import { Rule } from 'eslint';
import { ROKU_CALLFUNC_MAX_TOTAL_ARGUMENTS } from '@tantawowa/hosanna-supported-apis';

function getCalleeMemberName(callee: unknown): string | null {
  if (!callee || typeof callee !== 'object') {
    return null;
  }
  const n = callee as { type?: string; property?: { type?: string; name?: string }; expression?: unknown };
  if (n.type === 'TSNonNullExpression' && n.expression) {
    return getCalleeMemberName(n.expression);
  }
  if (n.type === 'MemberExpression' || n.type === 'OptionalMemberExpression') {
    const prop = n.property;
    if (prop && prop.type === 'Identifier' && typeof prop.name === 'string') {
      return prop.name;
    }
  }
  return null;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        `HS-1120: roSGNode CallFunc/callFunc supports at most ${ROKU_CALLFUNC_MAX_TOTAL_ARGUMENTS} total arguments on BrightScript; matches transpiler error.`,
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      tooManyArgs:
        'HS-1120: CallFunc supports at most {{max}} total arguments (function name plus pass-through args) on BrightScript; this call exceeds that limit.',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        const name = getCalleeMemberName(node.callee);
        if (name !== 'CallFunc' && name !== 'callFunc') {
          return;
        }
        if (node.arguments.length > ROKU_CALLFUNC_MAX_TOTAL_ARGUMENTS) {
          context.report({
            node,
            messageId: 'tooManyArgs',
            data: { max: String(ROKU_CALLFUNC_MAX_TOTAL_ARGUMENTS) },
          });
        }
      },
    };
  },
};

export default rule;
