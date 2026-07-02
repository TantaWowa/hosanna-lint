import { Rule, Scope } from 'eslint';

/**
 * Compat guard for hsc < 1.29.0 (fixed by transpiler commit 64c1997).
 *
 * When `??` lowers to the IIFE slow path (a call anywhere in either operand,
 * or the right side referencing variables used on the left) and an operand is
 * a BARE local identifier, older transpilers failed to capture that identifier
 * in the IIFE parameter list: `collectUsedVariablesAndCalls` used
 * `path.traverse`, which only visits descendants, so the root identifier of an
 * operand was never collected. The generated closure then read an
 * uninitialised variable and crashed on device (&he9).
 *
 * Safe shapes (never affected):
 * - `this.x ?? fallback()` — `m` is always passed to the IIFE
 * - `obj.prop ?? fallback()` — `obj` is a descendant, so it was collected
 * - `x = foo ?? fallback()` / `const x = foo ?? fallback()` — direct
 *   assignment to an identifier lowers to inline if/else, no IIFE
 * - `foo ?? literal` — no calls and no left-reference lowers to hs_coalesce
 */

const TRAVERSAL_KEYS = [
  'left',
  'right',
  'argument',
  'arguments',
  'test',
  'consequent',
  'alternate',
  'callee',
  'object',
  'property',
  'expression',
  'expressions',
  'elements',
  'properties',
  'value',
  'key',
] as const;

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
  for (const key of TRAVERSAL_KEYS) {
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
  for (const key of TRAVERSAL_KEYS) {
    const child = (node as unknown as { [k: string]: Rule.Node | Rule.Node[] | undefined })[key];
    if (child) {
      if (Array.isArray(child)) {
        if (child.some((c: Rule.Node) => hasCallExpression(c))) return true;
      } else if (hasCallExpression(child)) return true;
    }
  }
  return false;
}

/** Resolve `name` against the scope chain; returns the variable if declared in user code. */
function resolveVariable(scope: Scope.Scope | null, name: string): Scope.Variable | undefined {
  let current: Scope.Scope | null = scope;
  while (current) {
    const variable = current.variables.find((v) => v.name === name);
    if (variable && variable.defs.length > 0) {
      return variable;
    }
    current = current.upper;
  }
  return undefined;
}

/**
 * The transpiler lowers `x = a ?? b` / `const x = a ?? b` (identifier target,
 * `??` as the whole RHS) to an inline if/else assignment — no IIFE, no capture.
 */
function isOptimizedAssignmentContext(node: Rule.Node): boolean {
  const parent = node.parent as (Rule.Node & { init?: unknown; id?: { type?: string }; right?: unknown; left?: { type?: string } }) | null;
  if (!parent) return false;
  if (parent.type === 'VariableDeclarator') {
    return parent.init === node && parent.id?.type === 'Identifier';
  }
  if (parent.type === 'AssignmentExpression') {
    return parent.right === node && parent.left?.type === 'Identifier';
  }
  return false;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Bare local as `??` operand in IIFE-lowered positions is not captured by transpilers older than 1.29.0 and crashes on device',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      bareLocalNullishCapture:
        'Bare local "{{name}}" as a `??` operand here lowers to an IIFE (a call in an operand, or the right side referencing the left) and hsc < 1.29.0 fails to capture it, crashing on device (&he9). Fixed in hsc 1.29.0. To stay compatible with older toolchains: assign the result directly to a variable (const x = {{name}} ?? ...), capture via this. (this.{{name}} ?? ...), or access the value through a property (obj.{{name}} ?? ...).',
    },
  },
  create: function (context) {
    return {
      LogicalExpression: function (node) {
        if (node.operator !== '??') return;
        if (isOptimizedAssignmentContext(node as Rule.Node)) return;

        const left = node.left as Rule.Node;
        const right = node.right as Rule.Node;

        // Mirror the transpiler's IIFE trigger: calls anywhere in either
        // operand, or right referencing identifiers used in left.
        const leftIds = new Set<string>();
        collectIdentifiers(left, leftIds);
        const rightIds = new Set<string>();
        collectIdentifiers(right, rightIds);
        const rightRefsLeft = [...rightIds].some((id) => leftIds.has(id));
        const takesIifePath = rightRefsLeft || hasCallExpression(left) || hasCallExpression(right);
        if (!takesIifePath) return;

        const scope = context.sourceCode.getScope(node);
        for (const operand of [left, right]) {
          if (operand.type !== 'Identifier') continue;
          // Only declared locals/params/imports were capture candidates;
          // unresolved names (globals) never went through the capture list.
          if (!resolveVariable(scope, operand.name)) continue;
          context.report({
            node: operand,
            messageId: 'bareLocalNullishCapture',
            data: { name: operand.name },
          });
        }
      },
    };
  },
};

export default rule;
