import { Rule } from 'eslint';
import * as ts from 'typescript';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'HS-1014: Disallow for-of on non-array types. BrightScript only supports iterating over arrays.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      forOfOnNonArray:
        'HS-1014: for-of on non-array type "{{type}}". BrightScript only supports for-of on arrays. Use Array.from() or restructure your code.',
    },
  },
  create: function (context) {
    const parserServices = context.sourceCode?.parserServices as
      | { program?: ts.Program; getTypeAtLocation?: (node: Rule.Node) => ts.Type }
      | undefined;

    const hasTypeInfo =
      parserServices?.program && typeof parserServices.getTypeAtLocation === 'function';

    return {
      ForOfStatement: function (node) {
        if (!hasTypeInfo) return;

        try {
          const iterableType = parserServices!.getTypeAtLocation!(node.right as Rule.Node);
          const checker = parserServices!.program!.getTypeChecker();

          if (isIterableOrArray(iterableType, checker)) return;

          const typeStr = checker.typeToString(iterableType);
          context.report({
            node: node.right,
            messageId: 'forOfOnNonArray',
            data: { type: typeStr },
          });
        } catch {
          // If type lookup fails, skip
        }
      },
    };
  },
};

function isIterableOrArray(type: ts.Type, checker: ts.TypeChecker): boolean {
  if (type.flags & ts.TypeFlags.Any) return true;
  if (checker.isArrayType(type)) return true;
  if (checker.isTupleType(type)) return true;

  const typeStr = checker.typeToString(type);
  if (typeStr === 'string') return true;

  // Type parameters (generics): T extends readonly unknown[] - check the constraint
  if (type.flags & ts.TypeFlags.TypeParameter) {
    const constraint = checker.getBaseConstraintOfType(type);
    if (constraint) return isIterableOrArray(constraint, checker);
    // Unconstrained generic - be permissive, don't flag
    return true;
  }

  // Handle iterable types (IterableIterator, Map.entries(), etc.)
  const symbol = type.getSymbol();
  if (symbol) {
    const name = symbol.name;
    if (
      name === 'Array' || name === 'ReadonlyArray' ||
      name === 'IterableIterator' || name === 'Iterator' ||
      name === 'Iterable' || name === 'Generator' ||
      name === 'Set' || name === 'Map' ||
      name === 'MapIterator' || name === 'SetIterator'
    ) {
      return true;
    }
  }

  if (type.isUnion()) {
    return type.types.every(t => isIterableOrArray(t, checker));
  }

  // Handle intersection types (T[] & U[]) - if any part is array, it's iterable
  if (type.isIntersection()) {
    return type.types.some(t => isIterableOrArray(t, checker));
  }

  return false;
}

export default rule;
