import { Rule } from 'eslint';
import * as ts from 'typescript';

const NUMBER_METHODS = new Set([
  'toFixed', 'toPrecision', 'toExponential', 'toString', 'valueOf',
]);

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'HS-1107: Warn when calling number methods on a non-number type. Cast to number or add type information to avoid runtime errors.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      numberMethodOnNonNumber:
        'HS-1107: The method "{{method}}" is a number method, but the type of the object may not be a number (got "{{type}}"). Cast to number or add type information.',
    },
  },
  create: function (context) {
    const parserServices = context.sourceCode?.parserServices as
      | { program?: ts.Program; getTypeAtLocation?: (node: Rule.Node) => ts.Type }
      | undefined;

    const hasTypeInfo =
      parserServices?.program && typeof parserServices.getTypeAtLocation === 'function';

    return {
      CallExpression: function (node) {
        if (!hasTypeInfo) return;
        if (
          node.callee.type !== 'MemberExpression' ||
          node.callee.property.type !== 'Identifier'
        ) return;

        const methodName = node.callee.property.name;
        if (!NUMBER_METHODS.has(methodName)) return;
        if (methodName === 'toString' || methodName === 'valueOf') return;

        try {
          const objectType = parserServices!.getTypeAtLocation!(node.callee.object as Rule.Node);
          const checker = parserServices!.program!.getTypeChecker();

          if (objectType.flags & ts.TypeFlags.Any) return;
          if (objectType.flags & ts.TypeFlags.Unknown) return;
          if (objectType.flags & ts.TypeFlags.NumberLike) return;
          if (objectType.isUnion() && objectType.types.some(t => t.flags & ts.TypeFlags.NumberLike)) return;

          context.report({
            node: node.callee.property,
            messageId: 'numberMethodOnNonNumber',
            data: { method: methodName, type: checker.typeToString(objectType) },
          });
        } catch {
          // Skip if type lookup fails
        }
      },
    };
  },
};

export default rule;
