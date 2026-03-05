import { Rule } from 'eslint';

function collectIdentifiers(node: Rule.Node | undefined, identifiers: Set<string>): void {
  if (!node) return;
  if (node.type === 'Identifier') {
    identifiers.add(node.name);
    return;
  }
  if (node.type === 'MemberExpression') {
    if (node.object.type === 'Identifier') {
      identifiers.add(node.object.name);
    } else {
      collectIdentifiers(node.object as Rule.Node, identifiers);
    }
    if (node.property.type === 'Identifier') {
      identifiers.add(node.property.name);
    }
    return;
  }
  for (const key of ['left', 'right', 'argument', 'arguments', 'test', 'consequent', 'alternate', 'callee', 'object', 'property', 'expression'] as const) {
    const child = (node as unknown as { [k: string]: Rule.Node | Rule.Node[] | undefined })[key];
    if (child) {
      if (Array.isArray(child)) {
        for (const c of child) collectIdentifiers(c, identifiers);
      } else {
        collectIdentifiers(child, identifiers);
      }
    }
  }
}

function hasCallExpression(node: Rule.Node | undefined): boolean {
  if (!node) return false;
  if (node.type === 'CallExpression') return true;
  for (const key of ['left', 'right', 'argument', 'arguments', 'test', 'consequent', 'alternate', 'callee', 'object', 'property', 'expression'] as const) {
    const child = (node as unknown as { [k: string]: Rule.Node | Rule.Node[] | undefined })[key];
    if (child) {
      if (Array.isArray(child)) {
        if (child.some((c: Rule.Node) => hasCallExpression(c))) return true;
      } else if (hasCallExpression(child)) return true;
    }
  }
  return false;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'HS-1113: Nullish coalescing (??) uses IIFE (slow path) when right references left or has function calls.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      nullishCoalescingIifeSlowPath:
        'HS-1113: Nullish coalescing (??) uses IIFE (slow path) for correct short-circuit semantics. Consider refactoring to avoid function calls or right-side references to left in the expression, or use assignment context for faster if/else emission.',
    },
  },
  create: function (context) {
    return {
      LogicalExpression: function (node) {
        if (node.operator !== '??') return;

        const leftIds = new Set<string>();
        collectIdentifiers(node.left as Rule.Node, leftIds);

        const rightIds = new Set<string>();
        collectIdentifiers(node.right as Rule.Node, rightIds);

        const rightRefsLeft = [...rightIds].some((id) => leftIds.has(id));
        const hasCalls = hasCallExpression(node.left as Rule.Node) || hasCallExpression(node.right as Rule.Node);

        if (rightRefsLeft || hasCalls) {
          context.report({ node, messageId: 'nullishCoalescingIifeSlowPath' });
        }
      },
    };
  },
};

export default rule;
