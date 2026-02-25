import { Rule } from 'eslint';

type NodeWithParent = Rule.Node & { parent?: NodeWithParent };

/**
 * Check if the given node (an unsafe number-parsing expression) is used in a safe context
 * that handles NaN: isNaN(), ||, ??, or ternary condition.
 */
function isInSafeContext(node: NodeWithParent): boolean {
  let current: NodeWithParent | undefined = node.parent;

  while (current) {
    // isNaN(unsafeExpr) - safe: we're explicitly checking for NaN
    if (current.type === 'CallExpression') {
      const callee = current.callee;
      if (
        callee.type === 'Identifier' &&
        callee.name === 'isNaN' &&
        current.arguments[0] === node
      ) {
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
 * Check if this is .toFixed() called on the result of Number/parseInt/parseFloat
 */
function isUnsafeToFixedCall(node: Rule.Node): { name: string } | null {
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

  return null;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Warn when using Number(), parseInt(), parseFloat(), or .toFixed() without NaN handling. These can return NaN - use isNaN() checks, or safe fallbacks like a || b, a ?? b, or a ? b : c.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      unsafeNumberParsing:
        '{{name}} can return NaN. Use isNaN() to check, or a safe fallback like a || b, a ?? b, or a ? b : c.',
    },
  },
  create: function (context) {
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

        const unsafeToFixed = isUnsafeToFixedCall(node);
        if (unsafeToFixed) {
          // For .toFixed(), the unsafe part is the receiver (Number/parseInt/parseFloat call).
          // The whole CallExpression is the .toFixed() call. We need to check if the receiver
          // (which is the callee.object) is in a safe context. Actually the receiver is
          // the object of the MemberExpression - so the parent chain from the receiver
          // goes: receiver -> MemberExpression -> CallExpression (our node). So we should
          // check if our node (the CallExpression for .toFixed()) is in a safe context.
          if (!isInSafeContext(node)) {
            context.report({
              node,
              messageId: 'unsafeNumberParsing',
              data: { name: unsafeToFixed.name },
            });
          }
        }
      },
    };
  },
};

export default rule;
