import { Rule } from 'eslint';
import {
  containsFlagIdentifier,
  evaluateConditionalFlagExpression,
  type FlagEvalConfig,
} from '../utils/conditional-flag-eval';

type Options = {
  buildFlags?: Record<string, boolean>;
  platform?: string;
};

/**
 * HS-1011 subset: matches transpiler when conditional compilation mixes build flags with runtime
 * (IfStatement-utils.ts + ConditionalCompilation.ts).
 */
const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'HS-1011: Error when an if-condition mixes __BUILD__ flags with runtime expressions so it cannot be resolved at build-time.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [
      {
        type: 'object',
        properties: {
          buildFlags: { type: 'object', additionalProperties: { type: 'boolean' } },
          platform: { type: 'string' },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      mixed:
        'HS-1011: MixedConditionalCompilation: Conditional contains debug flags mixed with runtime expressions; cannot be resolved at build-time.',
    },
  },
  create(context) {
    const raw = (context.options?.[0] as Options | undefined) ?? {};
    const config: FlagEvalConfig = {
      buildFlags: raw.buildFlags,
      platform: raw.platform,
    };

    return {
      IfStatement(node: Rule.Node & { test?: unknown }) {
        const test = node.test as Parameters<typeof containsFlagIdentifier>[0];
        if (!test || !containsFlagIdentifier(test)) return;

        const evalRes = evaluateConditionalFlagExpression(test, config);
        if (evalRes.canEvaluate) return;
        if (evalRes.isMixed) {
          context.report({ node: test as Rule.Node, messageId: 'mixed' });
        }
      },
    };
  },
};

export default rule;
