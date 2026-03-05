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
      description: 'HS-1112: Ternary uses IIFE (slow path) when consequent/alternate references test variable or has function calls.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      ternaryIifeSlowPath:
        'HS-1112: Ternary uses IIFE (slow path) for correct short-circuit semantics. Consider refactoring to avoid referencing the test variable in branches, or use assignment context for faster if/else emission.',
    },
  },
  create: function (context) {
    return {
      ConditionalExpression: function (node) {
        const testIds = new Set<string>();
        collectIdentifiers(node.test as Rule.Node, testIds);

        const consequentIds = new Set<string>();
        collectIdentifiers(node.consequent as Rule.Node, consequentIds);

        const alternateIds = new Set<string>();
        collectIdentifiers(node.alternate as Rule.Node, alternateIds);

        // When test is this.prop, exclude 'this' from overlap - branches using this.otherProp
        // don't reference the tested value (this.prop), so no IIFE slow path is needed.
        const testIdsForOverlap =
          node.test.type === 'MemberExpression' &&
          node.test.object.type === 'Identifier' &&
          node.test.object.name === 'this'
            ? new Set([...testIds].filter((id) => id !== 'this'))
            : testIds;

        const consequentRefsTest = [...consequentIds].some((id) => testIdsForOverlap.has(id));
        const alternateRefsTest = [...alternateIds].some((id) => testIdsForOverlap.has(id));
        const hasCalls = hasCallExpression(node.consequent as Rule.Node) || hasCallExpression(node.alternate as Rule.Node);

        if (consequentRefsTest || alternateRefsTest || hasCalls) {
          // Assignment context (e.g. a = a ? 10 / a : a) enables faster if/else emission
          const parent = (node as Rule.Node & { parent?: Rule.Node }).parent;
          if (parent?.type === 'AssignmentExpression') {
            const assignment = parent as Rule.Node & { left: Rule.Node; right: Rule.Node };
            if (assignment.right === node) {
              const targetIds = new Set<string>();
              collectIdentifiers(assignment.left, targetIds);
              const isAssignmentContext = [...testIds].some((id) => targetIds.has(id));
              if (isAssignmentContext) return;
            }
          }
          context.report({ node, messageId: 'ternaryIifeSlowPath' });
        }
      },
    };
  },
};

export default rule;
