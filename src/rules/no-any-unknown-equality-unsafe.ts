import { Rule } from 'eslint';
import * as ts from 'typescript';
import { isBrsNodeType } from '../utils/is-brs-node-type';
import {
  classifyType,
  isNullishOnlyType,
  typeHasAnyOrUnknown,
} from '../utils/binary-comparison-type-utils';

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
    const parserServices = context.sourceCode?.parserServices as
      | { program?: ts.Program; getTypeAtLocation?: (node: Rule.Node) => ts.Type }
      | undefined;

    const hasTypeInfo =
      parserServices?.program && typeof parserServices.getTypeAtLocation === 'function';

    return {
      BinaryExpression: function (node) {
        if (!hasTypeInfo) return;
        if (node.operator !== '===' && node.operator !== '!==') return;

        try {
          const checker = parserServices!.program!.getTypeChecker();
          const leftType = parserServices!.getTypeAtLocation!(node.left as Rule.Node);
          const rightType = parserServices!.getTypeAtLocation!(node.right as Rule.Node);

          const leftWeak = typeHasAnyOrUnknown(leftType);
          const rightWeak = typeHasAnyOrUnknown(rightType);
          if (!leftWeak && !rightWeak) return;

          // SGNode+SGNode is HS-1114 (no-sgnode-equality-unsafe)
          if (isBrsNodeType(leftType) && isBrsNodeType(rightType)) return;

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
