import { Rule } from 'eslint';
import * as ts from 'typescript';
import { isBrsNodeType } from '../utils/is-brs-node-type';

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
    const parserServices = context.sourceCode?.parserServices as
      | { program?: ts.Program; getTypeAtLocation?: (node: Rule.Node) => ts.Type }
      | undefined;

    const hasTypeInfo =
      parserServices?.program && typeof parserServices.getTypeAtLocation === 'function';

    return {
      BinaryExpression: function (node) {
        if (!hasTypeInfo) return;
        if (!COMPARISON_OPERATORS.has(node.operator)) return;

        try {
          const checker = parserServices!.program!.getTypeChecker();
          const leftType = parserServices!.getTypeAtLocation!(node.left as Rule.Node);
          const rightType = parserServices!.getTypeAtLocation!(node.right as Rule.Node);

          const isLeftBrs = isBrsNodeType(leftType);
          const isRightBrs = isBrsNodeType(rightType);

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
