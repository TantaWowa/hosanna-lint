import { Rule } from 'eslint';
import {
  classifyType,
  isNullishOnlyType,
  typeHasAnyOrUnknown,
} from '../utils/binary-comparison-type-utils';
import {
  getCachedBinaryExpressionTypes,
  getTypeAwareParserServices,
  isCachedBrsNodeType,
} from '../utils/type-aware-cache';

/**
 * HS-1118: Strict equality (`===` / `!==`) with `any` or `unknown` on either side.
 * The transpiler emits hs_equal (not BrightScript `=`); reference equality is unsafe for objects.
 */

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'HS-1118: Strict equality with `any` or `unknown` uses hs_equal on Roku; BrightScript reference equality is unsafe.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      anyUnknownEqualityUsesHsEqual:
        'HS-1118: Strict equality (`===` / `!==`) involves `any` or `unknown`. The transpiler uses hs_equal for JS-like comparison; remove unnecessary casts or compare a stable primitive field (e.g. `_hid`) for clearer, faster code.',
    },
  },
  create: function (context) {
    const parserServices = getTypeAwareParserServices(context);

    return {
      BinaryExpression: function (node) {
        if (!parserServices) return;
        if (node.operator !== '===' && node.operator !== '!==') return;

        try {
          const { checker, leftType, rightType } = getCachedBinaryExpressionTypes(
            context.sourceCode,
            parserServices,
            node as unknown as Rule.Node & { left: Rule.Node; right: Rule.Node }
          );

          const leftWeak = typeHasAnyOrUnknown(leftType);
          const rightWeak = typeHasAnyOrUnknown(rightType);
          if (!leftWeak && !rightWeak) return;

          // SGNode+SGNode is HS-1114 (no-sgnode-equality-unsafe)
          if (isCachedBrsNodeType(leftType) && isCachedBrsNodeType(rightType)) return;

          // Transpiler: no hs_equal when comparing to null / undefined / void-only types
          if (isNullishOnlyType(leftType) || isNullishOnlyType(rightType)) return;

          // Transpiler: one weak side + other side is a known primitive (not nullish) → plain `=`
          const oneWeakOnePrimitive =
            (leftWeak &&
              !rightWeak &&
              classifyType(rightType, checker) === 'primitive') ||
            (rightWeak &&
              !leftWeak &&
              classifyType(leftType, checker) === 'primitive');

          if (oneWeakOnePrimitive) return;

          context.report({ node, messageId: 'anyUnknownEqualityUsesHsEqual' });
        } catch {
          // Skip if type lookup fails
        }
      },
    };
  },
};

export default rule;
