import { Rule } from 'eslint';
import {
  collectBoundVarNames,
  hasCallExpression,
  isOptimizedAssignmentContext,
  resolveVariable,
} from '../utils/iife-lowering-capture';

/**
 * Compat guard for hsc < 1.29.0 (fixed by transpiler commit 64c1997).
 *
 * The same root-identifier capture gap as no-nullish-coalescing-bare-local-capture,
 * for ternaries: when a ternary lowered to the IIFE slow path, older
 * transpilers failed to capture a branch that is a BARE local identifier (the
 * shared `collectUsedVariablesAndCalls` only visits descendants, never the
 * branch root). The generated closure read an uninitialised variable and
 * crashed on device (&he9).
 *
 * The IIFE was entered for a call in either branch, or a branch referencing
 * the test's "risky" identifiers. A bare branch contributes nothing to the
 * collected name sets, so it cannot trigger the reference path itself, and it
 * crashed only when its name appeared nowhere else in the branches as a bound
 * reference (otherwise the capture list — the union of both branches' names —
 * already carried it). The test itself is evaluated at the call site and
 * passed in as __hsCondition, so test identifiers are never captures.
 *
 * Safe shapes (never affected):
 * - `cond ? this.x : fallback()` — `m` is always passed to the IIFE
 * - `cond ? obj.x : fallback()` — descendants are collected
 * - `x = cond ? a : fallback()` / `const x = ...` — inline if/else, no IIFE
 * - `typeof v === "number" ? compute(v) : v` — `v` is captured via the consequent
 */

const EQUALITY_OPERATORS = new Set(['===', '!==', '==', '!=']);

/** Collect every identifier name in the test (matches the transpiler's unfiltered test scan). */
function collectAllIdentifiers(node: Rule.Node | undefined, names: Set<string>): void {
  if (!node || typeof (node as { type?: unknown }).type !== 'string') return;
  if (node.type === 'Identifier') {
    names.add(node.name);
    return;
  }
  const rec = node as unknown as Record<string, unknown>;
  for (const key of Object.keys(rec)) {
    if (key === 'parent' || key === 'loc' || key === 'range') continue;
    const val = rec[key];
    if (val && typeof val === 'object' && 'type' in (val as object)) {
      collectAllIdentifiers(val as Rule.Node, names);
    } else if (Array.isArray(val)) {
      for (const item of val) {
        if (item && typeof item === 'object' && 'type' in (item as object)) {
          collectAllIdentifiers(item as Rule.Node, names);
        }
      }
    }
  }
}

function isLiteralOperand(node: Rule.Node): boolean {
  return node.type === 'Literal';
}

/** Enum-like constant operands (Enum.Member) are exempt from the risky-test check. */
function isConstantLikeOperand(node: Rule.Node): boolean {
  return node.type === 'MemberExpression' && node.object.type === 'Identifier';
}

/**
 * Mirror the transpiler's getRiskyTestIdentifiers: for equality tests, only
 * the variable side is risky (literal / enum-like constant sides are exempt);
 * for any other test shape, every test identifier is risky.
 */
function getRiskyTestIdentifiers(test: Rule.Node): Set<string> {
  const risky = new Set<string>();
  if (test.type !== 'BinaryExpression' || !EQUALITY_OPERATORS.has(test.operator)) {
    collectAllIdentifiers(test, risky);
    return risky;
  }
  const left = test.left as Rule.Node;
  const right = test.right as Rule.Node;
  if (isLiteralOperand(left) || isLiteralOperand(right)) {
    if (!isLiteralOperand(left)) collectAllIdentifiers(left, risky);
    if (!isLiteralOperand(right)) collectAllIdentifiers(right, risky);
    return risky;
  }
  if (!isConstantLikeOperand(left)) collectAllIdentifiers(left, risky);
  if (!isConstantLikeOperand(right)) collectAllIdentifiers(right, risky);
  return risky;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Bare local as a ternary branch in IIFE-lowered positions is not captured by transpilers older than 1.29.0 and crashes on device',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      bareLocalTernaryCapture:
        'Bare local "{{name}}" as a ternary branch here lowers to an IIFE (a call in a branch, or the other branch referencing the test) and hsc < 1.29.0 fails to capture it, crashing on device (&he9). Fixed in hsc 1.29.0. To stay compatible with older toolchains: assign the result directly to a variable (const x = cond ? {{name}} : ...), capture via this. (this.{{name}}), or access the value through a property (obj.{{name}}).',
    },
  },
  create: function (context) {
    return {
      ConditionalExpression: function (node) {
        if (isOptimizedAssignmentContext(node as Rule.Node)) return;

        const consequent = node.consequent as Rule.Node;
        const alternate = node.alternate as Rule.Node;
        const scope = context.sourceCode.getScope(node);

        // Bound descendant names of each branch (root excluded) — exactly the
        // transpiler's per-branch collection. The union is the IIFE capture list.
        const cNames = collectBoundVarNames(consequent, scope);
        const aNames = collectBoundVarNames(alternate, scope);
        const captured = new Set<string>([...cNames, ...aNames]);

        const risky = getRiskyTestIdentifiers(node.test as Rule.Node);
        const branchRefsTest = [...captured].some((name) => risky.has(name));
        const takesIifePath = branchRefsTest || hasCallExpression(consequent) || hasCallExpression(alternate);
        if (!takesIifePath) return;

        for (const branch of [consequent, alternate]) {
          if (branch.type !== 'Identifier') continue;
          if (!resolveVariable(scope, branch.name)) continue;
          // If the bare branch's name appears elsewhere as a bound reference,
          // it is already in the capture list — no crash.
          if (captured.has(branch.name)) continue;
          context.report({
            node: branch,
            messageId: 'bareLocalTernaryCapture',
            data: { name: branch.name },
          });
        }
      },
    };
  },
};

export default rule;
