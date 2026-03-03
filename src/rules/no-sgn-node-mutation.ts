import { Rule } from 'eslint';
import * as ts from 'typescript';

const SGN_NODE_INTERFACES = new Set(['ISGNNode', 'ISGROSGNode', 'IBrsNode']);

/**
 * Warns when mutating a property of an ISGNNode (array/object) directly.
 * In SG (SignGraph), nodes are immutable - you must make a copy of the node, mutate the copy,
 * then assign it back. Mutating node.translation[1] or node.myData['foo'] directly mutates a copy
 * and won't update the actual node.
 */
const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Warn when mutating array/object properties on ISGNNode. In SG you must copy the node, mutate the copy, then assign.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      sgnNodeMutation:
        'Mutating a property on an ISGNNode (e.g. node.translation[1] = x) mutates a copy. In SG you must make a copy of the node, mutate the copy, then assign it.',
    },
  },
  create: function (context) {
    const parserServices = context.sourceCode?.parserServices as
      | { program?: ts.Program; getTypeAtLocation?: (node: Rule.Node) => ts.Type }
      | undefined;

    const hasTypeInfo =
      parserServices?.program && typeof parserServices.getTypeAtLocation === 'function';

    return {
      AssignmentExpression: function (node) {
        if (!hasTypeInfo) return;

        // left must be MemberExpression (e.g. node.translation[1] or node.myData['foo'])
        const left = node.left as import('estree').MemberExpression & { object?: unknown; property?: unknown };
        if (!left || left.type !== 'MemberExpression') return;

        // left.object must itself be a MemberExpression (node.prop) - we're mutating a nested property
        const innerMember = left.object as import('estree').MemberExpression & { object?: unknown; property?: unknown };
        if (!innerMember || innerMember.type !== 'MemberExpression') return;

        try {
          const checker = parserServices!.program!.getTypeChecker();

          // innerMember.object is the node (e.g. `node` in node.translation[1])
          const nodeType = parserServices!.getTypeAtLocation!(innerMember.object as Rule.Node);
          if (!isSgnNodeType(nodeType)) return;

          // innerMember is node.prop - we need the type of this property to be array or object
          const propType = parserServices!.getTypeAtLocation!(innerMember as Rule.Node);
          if (!isObjectOrArrayType(propType, checker)) return;

          context.report({ node: left, messageId: 'sgnNodeMutation' });
        } catch {
          // Skip on type lookup errors
        }
      },
    };
  },
};

function isSgnNodeType(type: ts.Type): boolean {
  const symbol = type.getSymbol();
  if (symbol && SGN_NODE_INTERFACES.has(symbol.name)) return true;

  if (type.isUnion()) {
    return type.types.some(t => isSgnNodeType(t));
  }

  const baseTypes = type.getBaseTypes?.();
  if (baseTypes) {
    return baseTypes.some(t => isSgnNodeType(t));
  }

  return false;
}

function isObjectOrArrayType(type: ts.Type, checker: ts.TypeChecker): boolean {
  // Exclude primitives
  if (type.flags & ts.TypeFlags.Number) return false;
  if (type.flags & ts.TypeFlags.String) return false;
  if (type.flags & ts.TypeFlags.Boolean) return false;
  if (type.flags & ts.TypeFlags.Null) return false;
  if (type.flags & ts.TypeFlags.Undefined) return false;
  if (type.flags & ts.TypeFlags.Void) return false;
  if (type.flags & ts.TypeFlags.Never) return false;
  if (type.flags & ts.TypeFlags.BigInt) return false;
  if (type.flags & ts.TypeFlags.StringLiteral) return false;
  if (type.flags & ts.TypeFlags.NumberLiteral) return false;
  if (type.flags & ts.TypeFlags.BooleanLiteral) return false;

  // any - be permissive, don't flag
  if (type.flags & ts.TypeFlags.Any) return false;

  // Arrays
  if (checker.isArrayType(type)) return true;
  if (checker.isTupleType(type)) return true;

  const symbol = type.getSymbol();
  if (symbol) {
    const name = symbol.name;
    if (name === 'Array' || name === 'ReadonlyArray') return true;
  }

  // Object types (interfaces, type literals, etc.)
  if (type.flags & ts.TypeFlags.Object) return true;

  // Union: if any member is object/array, we consider it mutable
  if (type.isUnion()) {
    return type.types.some(t => isObjectOrArrayType(t, checker));
  }

  return false;
}

export default rule;
