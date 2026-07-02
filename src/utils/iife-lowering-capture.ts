import { Rule, Scope } from 'eslint';

/**
 * Shared helpers that emulate the pre-1.29.0 transpiler capture logic for `??`
 * and ternary IIFE lowering, so the bare-local compat rules flag exactly the
 * shapes that crashed on device and nothing else.
 *
 * The transpiler collected the IIFE's captured variable names by running
 * `path.traverse` over each operand/branch: it visits DESCENDANT identifiers
 * only (never the operand root), and keeps a name only when it resolves to a
 * binding (so member-property names and object keys, which have no binding,
 * are dropped). The capture list is the UNION of both operands'/branches'
 * collected names. A bare-identifier operand therefore crashed only when its
 * name did not appear anywhere else in the expression as a bound reference —
 * otherwise the union already carried it.
 */

const SKIP_KEYS = new Set(['parent', 'loc', 'range', 'leadingComments', 'trailingComments', 'typeAnnotation', 'returnType']);

/** Resolve `name` against the scope chain; returns the variable if declared in user code. */
export function resolveVariable(scope: Scope.Scope | null, name: string): Scope.Variable | undefined {
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
 * Collect the bound variable names the transpiler would have captured for one
 * operand/branch: descendant identifiers (root excluded) that resolve to a
 * variable, skipping member-property names and non-computed object keys.
 */
export function collectBoundVarNames(root: Rule.Node, scope: Scope.Scope): Set<string> {
  const names = new Set<string>();

  function walk(node: Rule.Node | null | undefined, isRoot: boolean): void {
    if (!node || typeof (node as { type?: unknown }).type !== 'string') return;

    if (node.type === 'Identifier') {
      // The root is the operand/branch itself; `path.traverse` never visits it.
      if (!isRoot && resolveVariable(scope, node.name)) {
        names.add(node.name);
      }
      return;
    }
    if (node.type === 'MemberExpression') {
      walk(node.object as Rule.Node, false);
      // The property has no binding unless the access is computed (obj[expr]).
      if (node.computed) walk(node.property as Rule.Node, false);
      return;
    }
    if (node.type === 'Property' && !(node as unknown as { computed?: boolean }).computed) {
      // Skip the key (no binding); walk the value.
      walk((node as unknown as { value: Rule.Node }).value, false);
      return;
    }

    const rec = node as unknown as Record<string, unknown>;
    for (const key of Object.keys(rec)) {
      if (SKIP_KEYS.has(key)) continue;
      const val = rec[key];
      if (val && typeof val === 'object' && 'type' in (val as object)) {
        walk(val as Rule.Node, false);
      } else if (Array.isArray(val)) {
        for (const item of val) {
          if (item && typeof item === 'object' && 'type' in (item as object)) {
            walk(item as Rule.Node, false);
          }
        }
      }
    }
  }

  walk(root, true);
  return names;
}

/** True when the subtree contains a call expression (matches the transpiler's mutating-call trigger). */
export function hasCallExpression(node: Rule.Node | null | undefined): boolean {
  if (!node || typeof (node as { type?: unknown }).type !== 'string') return false;
  if (node.type === 'CallExpression') return true;
  const rec = node as unknown as Record<string, unknown>;
  for (const key of Object.keys(rec)) {
    if (SKIP_KEYS.has(key)) continue;
    const val = rec[key];
    if (val && typeof val === 'object' && 'type' in (val as object)) {
      if (hasCallExpression(val as Rule.Node)) return true;
    } else if (Array.isArray(val)) {
      for (const item of val) {
        if (item && typeof item === 'object' && 'type' in (item as object) && hasCallExpression(item as Rule.Node)) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * The transpiler lowers `x = <expr>` / `const x = <expr>` (identifier target,
 * the `??`/ternary as the whole RHS) to an inline if/else — no IIFE, no capture.
 */
export function isOptimizedAssignmentContext(node: Rule.Node): boolean {
  const parent = node.parent as
    | (Rule.Node & { init?: unknown; id?: { type?: string }; right?: unknown; left?: { type?: string } })
    | null;
  if (!parent) return false;
  if (parent.type === 'VariableDeclarator') {
    return parent.init === node && parent.id?.type === 'Identifier';
  }
  if (parent.type === 'AssignmentExpression') {
    return parent.right === node && parent.left?.type === 'Identifier';
  }
  return false;
}
