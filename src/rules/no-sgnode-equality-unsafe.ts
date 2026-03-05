import { Rule } from 'eslint';
import * as ts from 'typescript';

const BRS_NODE_INTERFACES = new Set(['ISGROSGNode', 'IBrsNode', 'ISGNNode']);

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
    const parserServices = context.sourceCode?.parserServices as
      | { program?: ts.Program; getTypeAtLocation?: (node: Rule.Node) => ts.Type }
      | undefined;

    const hasTypeInfo =
      parserServices?.program && typeof parserServices.getTypeAtLocation === 'function';

    return {
      BinaryExpression: function (node) {
        if (!hasTypeInfo) return;
        if (!['===', '!==', '==', '!='].includes(node.operator)) return;

        try {
          const leftType = parserServices!.getTypeAtLocation!(node.left as Rule.Node);
          const rightType = parserServices!.getTypeAtLocation!(node.right as Rule.Node);

          if (isBrsNodeType(leftType) && isBrsNodeType(rightType)) {
            context.report({ node, messageId: 'sgnodeEqualityUsesHsEqual' });
          }
        } catch {
          // Skip if type lookup fails
        }
      },
    };
  },
};

function isBrsNodeType(type: ts.Type): boolean {
  const symbol = type.getSymbol();
  if (symbol && BRS_NODE_INTERFACES.has(symbol.name)) return true;

  if (type.isUnion()) {
    return type.types.some((t) => isBrsNodeType(t));
  }

  const baseTypes = type.getBaseTypes?.();
  if (baseTypes) {
    return baseTypes.some((t) => isBrsNodeType(t));
  }

  return false;
}

export default rule;
