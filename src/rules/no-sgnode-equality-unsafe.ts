import { Rule } from 'eslint';
import {
  getCachedBinaryExpressionTypes,
  getTypeAwareParserServices,
  isCachedBrsNodeType,
} from '../utils/type-aware-cache';

/**
 * HS-1114: Warn about SGNode instance equality (node === otherNode).
 * Direct === on SceneGraph nodes is not safe on Roku; the transpiler uses hs_equal for safe comparison.
 */
const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'HS-1114: SGNode equality (===) is not safe on Roku. The transpiler uses hs_equal for safe instance comparison.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      sgnodeEqualityUsesHsEqual:
        'HS-1114: SGNode equality (===) is not safe on Roku. The transpiler uses hs_equal for safe instance comparison.',
    },
  },
  create: function (context) {
    const parserServices = getTypeAwareParserServices(context);

    return {
      BinaryExpression: function (node) {
        if (!parserServices) return;
        if (!['===', '!==', '==', '!='].includes(node.operator)) return;

        try {
          const { leftType, rightType } = getCachedBinaryExpressionTypes(
            context.sourceCode,
            parserServices,
            node as unknown as Rule.Node & { left: Rule.Node; right: Rule.Node }
          );

          if (isCachedBrsNodeType(leftType) && isCachedBrsNodeType(rightType)) {
            context.report({ node, messageId: 'sgnodeEqualityUsesHsEqual' });
          }
        } catch {
          // Skip if type lookup fails
        }
      },
    };
  },
};

export default rule;
