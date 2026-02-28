import { Rule } from 'eslint';
import * as ts from 'typescript';

type NodeWithParent = Rule.Node & { parent?: NodeWithParent };

/**
 * Check if a TypeScript type is number-like (can hold NaN at runtime).
 * Uses TypeFlags.NumberLike and union type handling.
 */
function isNumberLikeType(type: ts.Type, checker: ts.TypeChecker): boolean {
  if ((type.flags & ts.TypeFlags.NumberLike) !== 0) {
    return true;
  }
  if ((type.flags & ts.TypeFlags.Any) !== 0) {
    return false;
  }
  const unionTypes = (type as ts.UnionType).types;
  if (unionTypes) {
    return unionTypes.every((t) => isNumberLikeType(t, checker));
  }
  return false;
}

/**
 * Check if the given node (an unsafe number-parsing expression) is used in a safe context
 * that handles NaN: isNaN(), ||, ??, or ternary condition.
 */
function isInSafeContext(node: NodeWithParent): boolean {
  let current: NodeWithParent | undefined = node.parent;

  while (current) {
    // isNaN(unsafeExpr) or Number.isNaN(unsafeExpr) - safe: explicitly checking for NaN
    if (current.type === 'CallExpression') {
      const callee = current.callee;
      const isArgToIsNaN =
        (callee.type === 'Identifier' && callee.name === 'isNaN') ||
        (callee.type === 'MemberExpression' &&
          callee.object.type === 'Identifier' &&
          callee.object.name === 'Number' &&
          callee.property.type === 'Identifier' &&
          callee.property.name === 'isNaN');
      if (isArgToIsNaN && current.arguments.some((arg) => arg === node)) {
        return true;
      }
    }

    // unsafeExpr || fallback or unsafeExpr ?? fallback - safe: provides fallback for NaN
    if (current.type === 'LogicalExpression') {
      if ((current.operator === '||' || current.operator === '??') && current.left === node) {
        return true;
      }
    }

    // unsafeExpr ? a : b - safe: NaN is falsy, so we get the fallback
    if (current.type === 'ConditionalExpression' && current.test === node) {
      return true;
    }

    // For MemberExpression (e.g. .toFixed), the parent of our CallExpression is the MemberExpression.
    // We need to keep walking - the MemberExpression might be in a safe context.
    // Don't treat MemberExpression as a stopping point - the parent of MemberExpression could be safe.

    current = current.parent;
  }

  return false;
}

/**
 * Check if this is an unsafe number-parsing call: Number(), parseInt(), or parseFloat()
 */
function isUnsafeNumberCall(node: Rule.Node): { name: string } | null {
  if (node.type !== 'CallExpression') return null;

  const callee = node.callee;

  // Number(x) - constructor call
  if (callee.type === 'Identifier' && callee.name === 'Number') {
    return { name: 'Number()' };
  }

  // parseInt(x) or parseFloat(x) - global
  if (callee.type === 'Identifier') {
    if (callee.name === 'parseInt') return { name: 'parseInt()' };
    if (callee.name === 'parseFloat') return { name: 'parseFloat()' };
  }

  // Number.parseInt(x) or Number.parseFloat(x)
  if (callee.type === 'MemberExpression') {
    if (
      callee.object.type === 'Identifier' &&
      callee.object.name === 'Number' &&
      callee.property.type === 'Identifier'
    ) {
      if (callee.property.name === 'parseInt') return { name: 'Number.parseInt()' };
      if (callee.property.name === 'parseFloat') return { name: 'Number.parseFloat()' };
    }
  }

  return null;
}

/**
 * Check if the node is a numeric literal (provably not NaN)
 */
function isNumericLiteral(node: Rule.Node): boolean {
  if (node.type === 'Literal') {
    return typeof node.value === 'number' && !Number.isNaN(node.value);
  }
  return false;
}

/**
 * Check if this is a .toFixed() call. Returns the function name for reporting.
 * Flags: (1) direct Number/parseInt/parseFloat.toFixed(), (2) any other .toFixed() on non-literal receiver.
 */
function getToFixedCallInfo(node: Rule.Node): { name: string } | null {
  if (node.type !== 'CallExpression') return null;

  const callee = node.callee;
  if (callee.type !== 'MemberExpression') return null;
  if (
    callee.property.type !== 'Identifier' ||
    callee.property.name !== 'toFixed'
  ) {
    return null;
  }

  const receiver = callee.object;
  const unsafeCall = isUnsafeNumberCall(receiver as Rule.Node);
  if (unsafeCall) {
    return { name: `${unsafeCall.name}.toFixed()` };
  }

  // Receiver is not a direct unsafe call - flag if not a numeric literal (provably safe)
  if (isNumericLiteral(receiver as Rule.Node)) {
    return null;
  }

  return { name: 'toFixed' };
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'HS-1105: Disallow Number(), parseInt(), parseFloat(), Number.parseInt, Number.parseFloat, or .toFixed() without NaN handling. These can return NaN, which is dangerous on Roku. Use isNaN() checks, or safe fallbacks like a || b or a ?? b.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      unsafeNumberParsing:
        '"{{name}}" can return NaN, which is dangerous on Roku. Always validate the result using isNaN(value), or use truthy fallbacks like a || b or a ?? b. Examples: const n = parseInt(str); if (isNaN(n)) n = 0; or const n = parseFloat(str) ?? 0; or const s = (x).toFixed(2) || "0.00";',
    },
  },
  create: function (context) {
    const parserServices = context.sourceCode?.parserServices as
      | { program?: ts.Program; getTypeAtLocation?: (node: Rule.Node) => ts.Type }
      | undefined;

    const hasTypeInfo =
      parserServices?.program && typeof parserServices.getTypeAtLocation === 'function';

    return {
      CallExpression: function (node: NodeWithParent) {
        const unsafeCall = isUnsafeNumberCall(node);
        if (unsafeCall) {
          if (!isInSafeContext(node)) {
            context.report({
              node,
              messageId: 'unsafeNumberParsing',
              data: { name: unsafeCall.name },
            });
          }
          return;
        }

        const toFixedInfo = getToFixedCallInfo(node);
        if (toFixedInfo) {
          if (hasTypeInfo && toFixedInfo.name === 'toFixed') {
            const callee = (node as Rule.Node & { callee: { object: Rule.Node } }).callee;
            const receiver = callee.object;
            try {
              const receiverType = parserServices!.getTypeAtLocation!(receiver);
              const checker = parserServices!.program!.getTypeChecker();
              if (!isNumberLikeType(receiverType, checker)) {
                return;
              }
            } catch {
              // Fall through to flag if type lookup fails
            }
          }
          if (!isInSafeContext(node)) {
            context.report({
              node,
              messageId: 'unsafeNumberParsing',
              data: { name: toFixedInfo.name },
            });
          }
        }
      },
    };
  },
};

export default rule;
