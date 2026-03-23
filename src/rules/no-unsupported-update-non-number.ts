import { Rule } from 'eslint';
import * as ts from 'typescript';

/**
 * Mirrors UpdateExpression-utils: ++/-- only for number-like receivers.
 */
const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'HS-1026: Update expressions (++/--) are only supported on numeric types in Hosanna.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      unsupportedUpdate:
        'HS-1026: UnsupportedUpdateExpressionOperator: Update expression is not supported for this type ({{type}}).',
    },
  },
  create(context) {
    const parserServices = context.sourceCode?.parserServices as
      | { program?: ts.Program; getTypeAtLocation?: (node: Rule.Node) => ts.Type }
      | undefined;

    const hasTypeInfo =
      parserServices?.program && typeof parserServices.getTypeAtLocation === 'function';

    return {
      UpdateExpression(node) {
        if (!hasTypeInfo) return;
        if (node.operator !== '++' && node.operator !== '--') return;

        try {
          const argType = parserServices!.getTypeAtLocation!(node.argument as Rule.Node);
          const checker = parserServices!.program!.getTypeChecker();

          if (argType.flags & ts.TypeFlags.Any) return;
          if (argType.flags & ts.TypeFlags.Unknown) return;
          if (argType.flags & ts.TypeFlags.NumberLike) return;

          context.report({
            node,
            messageId: 'unsupportedUpdate',
            data: { type: checker.typeToString(argType) },
          });
        } catch {
          // skip
        }
      },
    };
  },
};

export default rule;
