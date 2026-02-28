import { Rule } from 'eslint';
import * as ts from 'typescript';

/**
 * HS-1042/1043/1044: The transpiler flags these only in specific ambiguous
 * scenarios. We only flag when the type checker provides clear evidence of
 * a mismatch (e.g. string literal key on a confirmed array type, or a
 * non-numeric string literal on an array). We skip anything ambiguous
 * to avoid false positives.
 */
const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'HS-1042: Warn about accessing arrays with non-numeric string literal keys.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      arrayWithNonNumericStringLiteral:
        'HS-1042_1: Cannot access array with non-numeric string literal "{{key}}". Arrays must be accessed with numeric indices.',
    },
  },
  create: function (context) {
    const parserServices = context.sourceCode?.parserServices as
      | { program?: ts.Program; getTypeAtLocation?: (node: Rule.Node) => ts.Type }
      | undefined;

    const hasTypeInfo =
      parserServices?.program && typeof parserServices.getTypeAtLocation === 'function';

    return {
      MemberExpression: function (node) {
        if (!hasTypeInfo || !node.computed) return;

        // Only flag the most clear-cut case: string literal key on an array
        if (node.property.type !== 'Literal' || typeof node.property.value !== 'string') return;

        const stringKey = node.property.value;
        if (!isNaN(Number(stringKey))) return;

        try {
          const checker = parserServices!.program!.getTypeChecker();
          const objectType = parserServices!.getTypeAtLocation!(node.object as Rule.Node);

          if (checker.isArrayType(objectType) || checker.isTupleType(objectType)) {
            context.report({
              node,
              messageId: 'arrayWithNonNumericStringLiteral',
              data: { key: stringKey },
            });
          }
        } catch {
          // Skip
        }
      },
    };
  },
};

export default rule;
