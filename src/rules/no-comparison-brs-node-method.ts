import { Rule } from 'eslint';
import * as ts from 'typescript';

const BRS_NODE_INTERFACES = new Set(['ISGROSGNode', 'IBrsNode', 'ISGNNode']);

/**
 * HS-1104: The transpiler warns about comparing METHODS of ISGROSGNode/IBrsNode.
 * Accessing a method property on an SG node (without calling it) can crash at runtime.
 * We only flag when the member being accessed is actually a method (has call signatures),
 * not when it's a regular property like .id or .visible.
 */
const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'HS-1104: Warn about comparing methods of ISGROSGNode or IBrsNode, which can crash at runtime on Roku.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      comparisonOfBrsNodeMethod:
        'HS-1104: Comparing a method of ISGROSGNode or IBrsNode can crash at runtime on Roku. Use a different comparison strategy.',
    },
  },
  create: function (context) {
    const parserServices = context.sourceCode?.parserServices as
      | { program?: ts.Program; getTypeAtLocation?: (node: Rule.Node) => ts.Type }
      | undefined;

    const hasTypeInfo =
      parserServices?.program && typeof parserServices.getTypeAtLocation === 'function';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function isBrsNodeMethodAccess(expr: any): boolean {
      if (expr.type !== 'MemberExpression') return false;
      if (expr.property?.type !== 'Identifier') return false;

      try {
        const objectType = parserServices!.getTypeAtLocation!(expr.object as Rule.Node);
        if (!isBrsNodeType(objectType)) return false;

        // Check that the member being accessed is actually a method (has call signatures)
        const checker = parserServices!.program!.getTypeChecker();
        const memberType = parserServices!.getTypeAtLocation!(expr as Rule.Node);
        if (memberType.getCallSignatures().length > 0) return true;

        // Also check via the apparent type's property symbol
        const apparentType = checker.getApparentType(objectType);
        const propSymbol = apparentType.getProperty(expr.property.name);
        if (propSymbol) {
          const propType = checker.getTypeOfSymbolAtLocation(propSymbol, expr as unknown as ts.Node);
          if (propType.getCallSignatures().length > 0) return true;
        }

        return false;
      } catch {
        return false;
      }
    }

    return {
      BinaryExpression: function (node) {
        if (!hasTypeInfo) return;
        if (!['===', '!==', '==', '!='].includes(node.operator)) return;

        if (isBrsNodeMethodAccess(node.left as Rule.Node) || isBrsNodeMethodAccess(node.right as Rule.Node)) {
          context.report({ node, messageId: 'comparisonOfBrsNodeMethod' });
        }
      },
    };
  },
};

function isBrsNodeType(type: ts.Type): boolean {
  const symbol = type.getSymbol();
  if (symbol && BRS_NODE_INTERFACES.has(symbol.name)) return true;

  if (type.isUnion()) {
    return type.types.some(t => isBrsNodeType(t));
  }

  const baseTypes = type.getBaseTypes?.();
  if (baseTypes) {
    return baseTypes.some(t => isBrsNodeType(t));
  }

  return false;
}

export default rule;
