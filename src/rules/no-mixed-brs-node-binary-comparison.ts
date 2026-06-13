import { Rule } from 'eslint';
import * as ts from 'typescript';
import {
  getCachedBinaryExpressionTypes,
  getTypeAwareParserServices,
  isCachedBrsNodeType,
} from '../utils/type-aware-cache';

const COMPARISON_OPERATORS = new Set(['===', '!==', '==', '!=', '<', '>', '<=', '>=']);

/** Mirrors BinaryExpression-utils early null/undefined exit (pure types only). */
function isPureNullOrUndefinedType(type: ts.Type): boolean {
  return !!(type.flags & ts.TypeFlags.Null) || !!(type.flags & ts.TypeFlags.Undefined);
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'HS-1019: Disallow comparing a BRS/SG node type to a non-node type (transpiler error path; unlike hs_equal fallback for same-kind comparisons).',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      mixedBrsNodeComparison:
        'HS-1019: Comparing a SceneGraph/BRS node type to a non-node type ({{leftType}} {{operator}} {{rightType}}) is not supported in BrightScript the same way as in TypeScript. Compare a stable id field, use hs_equal-friendly patterns, or align both sides to the same node interface.',
    },
  },
  create: function (context) {
    const parserServices = getTypeAwareParserServices(context);

    return {
      BinaryExpression: function (node) {
        if (!parserServices) return;
        if (!COMPARISON_OPERATORS.has(node.operator)) return;

        try {
          const { checker, leftType, rightType } = getCachedBinaryExpressionTypes(
            context.sourceCode,
            parserServices,
            node as unknown as Rule.Node & { left: Rule.Node; right: Rule.Node }
          );

          const isLeftBrs = isCachedBrsNodeType(leftType);
          const isRightBrs = isCachedBrsNodeType(rightType);

          if (!isLeftBrs && !isRightBrs) return;
          if (isLeftBrs && isRightBrs) return;

          if (isPureNullOrUndefinedType(leftType) || isPureNullOrUndefinedType(rightType)) return;

          context.report({
            node,
            messageId: 'mixedBrsNodeComparison',
            data: {
              leftType: checker.typeToString(leftType),
              rightType: checker.typeToString(rightType),
              operator: node.operator,
            },
          });
        } catch {
          // Skip if type lookup fails
        }
      },
    };
  },
};

export default rule;
