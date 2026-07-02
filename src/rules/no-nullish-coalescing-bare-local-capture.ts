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
 * When `??` lowered to the IIFE slow path and an operand was a BARE local
 * identifier, older transpilers failed to capture that identifier in the IIFE
 * parameter list: `collectUsedVariablesAndCalls` used `path.traverse`, which
 * only visits descendants, so the root identifier of an operand was never
 * collected. The generated closure then read an uninitialised variable and
 * crashed on device (&he9).
 *
 * The IIFE was entered for one of two reasons: a call in either operand, or
 * the right operand referencing a bound name used in the left. A bare operand
 * contributes nothing to those name sets, so the right-references-left trigger
 * can never involve a bare operand — the only trigger compatible with a bare
 * operand is a CALL. The crash then occurred only when the bare operand's name
 * appeared nowhere else in the expression as a bound reference (otherwise the
 * capture list, which is the union of both operands' collected names, already
 * carried it).
 *
 * Safe shapes (never affected):
 * - `this.x ?? fallback()` — `m` is always passed to the IIFE
 * - `obj.prop ?? fallback()` — `obj` is a descendant, so it was collected
 * - `x = foo ?? fallback()` / `const x = foo ?? fallback()` — inline if/else
 * - `foo ?? bar`, `foo ?? this.foo` — no calls meant hs_coalesce, no capture
 * - `foo ?? bar(foo)` — `foo` is captured via the right operand
 */

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Bare local as a `??` operand in IIFE-lowered positions is not captured by transpilers older than 1.29.0 and crashes on device',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      bareLocalNullishCapture:
        'Bare local "{{name}}" as a `??` operand here lowers to an IIFE (a call in an operand) and hsc < 1.29.0 fails to capture it, crashing on device (&he9). Fixed in hsc 1.29.0. To stay compatible with older toolchains: assign the result directly to a variable (const x = {{name}} ?? ...), capture via this. (this.{{name}} ?? ...), or access the value through a property (obj.{{name}} ?? ...).',
    },
  },
  create: function (context) {
    return {
      LogicalExpression: function (node) {
        if (node.operator !== '??') return;
        if (isOptimizedAssignmentContext(node as Rule.Node)) return;

        const left = node.left as Rule.Node;
        const right = node.right as Rule.Node;

        // Pre-fix, the only IIFE trigger compatible with a bare operand was a
        // call in either operand.
        if (!hasCallExpression(left) && !hasCallExpression(right)) return;

        const scope = context.sourceCode.getScope(node);
        // The transpiler's capture list is the union of both operands' bound
        // descendant names (each operand's own root excluded).
        const captured = new Set<string>([
          ...collectBoundVarNames(left, scope),
          ...collectBoundVarNames(right, scope),
        ]);

        for (const operand of [left, right]) {
          if (operand.type !== 'Identifier') continue;
          if (!resolveVariable(scope, operand.name)) continue;
          // If the bare operand's name appears elsewhere as a bound reference,
          // it is already in the capture list — no crash.
          if (captured.has(operand.name)) continue;
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
