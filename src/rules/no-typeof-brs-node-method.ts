import { Rule } from 'eslint';
import * as ts from 'typescript';

const BRS_NODE_INTERFACES = new Set(['ISGROSGNode', 'IBrsNode']);

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'HS-1103: Warn about typeof on methods of ISGROSGNode or IBrsNode, which can crash at runtime on Roku.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      typeofOnBrsNodeMethod:
        'HS-1103: typeof on a method of ISGROSGNode or IBrsNode can crash at runtime on Roku. Use a different check or store the method reference safely.',
    },
  },
  create: function (context) {
    const parserServices = context.sourceCode?.parserServices as
      | { program?: ts.Program; getTypeAtLocation?: (node: Rule.Node) => ts.Type }
      | undefined;

    const hasTypeInfo =
      parserServices?.program && typeof parserServices.getTypeAtLocation === 'function';

    return {
      UnaryExpression: function (node) {
        if (!hasTypeInfo) return;
        if (node.operator !== 'typeof') return;
        if (node.argument.type !== 'MemberExpression') return;

        try {
          const objectType = parserServices!.getTypeAtLocation!(node.argument.object as Rule.Node);
          if (isBrsNodeType(objectType)) {
            context.report({ node, messageId: 'typeofOnBrsNodeMethod' });
          }
        } catch {
          // Skip
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
