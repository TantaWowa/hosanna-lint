import { Rule, Scope } from 'eslint';

type VariableDeclaratorNode = Rule.Node & {
  id: Rule.Node & { type: string; name?: string };
  init: Rule.Node | null;
};

/** Keys to skip when traversing AST - avoid circular refs (parent) and non-AST data */
const SKIP_KEYS = new Set(['parent', 'loc', 'range', 'leadingComments', 'trailingComments']);

/**
 * Recursively collect all ArrowFunctionExpression and FunctionExpression nodes
 * within an expression.
 */
function collectClosuresInExpression(expr: Rule.Node): Rule.Node[] {
  const closures: Rule.Node[] = [];

  function visit(n: Rule.Node) {
    if (n.type === 'ArrowFunctionExpression' || n.type === 'FunctionExpression') {
      closures.push(n);
      // Still recurse into the closure body - there may be nested closures
    }
    const rec = n as unknown as Record<string, unknown>;
    for (const key of Object.keys(rec)) {
      if (SKIP_KEYS.has(key)) continue;
      const val = rec[key];
      if (val && typeof val === 'object' && val !== null && 'type' in val) {
        visit(val as Rule.Node);
      } else if (Array.isArray(val)) {
        for (const item of val) {
          if (item && typeof item === 'object' && item !== null && 'type' in item) {
            visit(item as Rule.Node);
          }
        }
      }
    }
  }
  visit(expr);
  return closures;
}

/**
 * Check if an identifier is the object of a MemberExpression or OptionalMemberExpression.
 * In that case we're reading a property (e.g. ref.id) - the object is assigned, so don't flag.
 */
function isObjectOfMemberExpression(identifier: Rule.Node): boolean {
  const parent = identifier.parent as { object?: Rule.Node; type?: string } | null;
  const parentType = parent?.type;
  if (parent && (parentType === 'MemberExpression' || parentType === 'OptionalMemberExpression')) {
    return parent.object === identifier;
  }
  return false;
}

/**
 * Find problematic references in a closure: identifiers that reference the LHS variable
 * (declared by this declarator) and are not object-of-MemberExpression.
 */
function getProblematicReferences(
  scope: Scope.Scope,
  lhsName: string,
  declarator: Rule.Node
): Rule.Node[] {
  const problematic: Rule.Node[] = [];
  const functionScope = scope;

  for (const ref of scope.references) {
    const variable = ref.resolved;
    if (!variable) continue;
    if (variable.name !== lhsName) continue;
    if (variable.scope === functionScope) continue; // Local to this function

    // Check that this variable is declared by our declarator
    const def = variable.defs[0];
    if (!def || def.node !== declarator) continue;

    const identifier = ref.identifier as Rule.Node;
    if (isObjectOfMemberExpression(identifier)) continue; // ref.id pattern - don't flag

    problematic.push(identifier);
  }
  return problematic;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow closures that capture a variable assigned from the expression containing them',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      closureCapturesVariableBeforeAssignment:
        'ClosureCapturesVariableBeforeAssignment: A closure cannot capture a variable that is assigned from the expression that contains it (e.g. const timerId = setTimeout(() => clearTimeout(timerId), 400)). At closure creation time the variable is uninitialized. Hoist onto an object: const ref = {}; ref.id = setTimeout(() => clearTimeout(ref.id), 400);',
    },
  },
  create: function (context) {
    return {
      VariableDeclarator: function (node: Rule.Node) {
        const declarator = node as VariableDeclaratorNode;
        if (!declarator.init) return;
        if (declarator.id.type !== 'Identifier') return; // Skip destructuring for v1

        const parent = declarator.parent as { kind?: string } | null;
        const kind = parent?.kind;
        if (kind !== 'const' && kind !== 'let') return; // Only const/let have TDZ

        const lhsName = declarator.id.name;
        if (!lhsName) return;

        const closures = collectClosuresInExpression(declarator.init);
        for (const closure of closures) {
          const scope = context.sourceCode.getScope(closure);
          if (scope.type !== 'function') continue;

          const problematic = getProblematicReferences(scope, lhsName, declarator);
          for (const identifier of problematic) {
            context.report({
              node: identifier,
              messageId: 'closureCapturesVariableBeforeAssignment',
            });
          }
        }
      },
    };
  },
};

export default rule;
