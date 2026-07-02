import { Rule } from 'eslint';

/**
 * Compat guard for hsc < 1.32.0 (fixed by transpiler commit a354b70).
 *
 * Babel does not register scope bindings for TSParameterProperty params
 * (constructor parameter properties such as `constructor(private x: T)`), so
 * closures created inside the constructor — most commonly in super(...)
 * arguments — never saw the param as a capturable variable. The bare
 * identifier leaked into the generated BrightScript and was invalid at call
 * time. Plain (unmodified) constructor params always had bindings and were
 * captured correctly.
 */

type TSParameterPropertyNode = Rule.Node & {
  parameter: Rule.Node & { left?: Rule.Node };
};

/** Keys to skip when traversing AST - avoid circular refs (parent) and non-AST data */
const SKIP_KEYS = new Set(['parent', 'loc', 'range', 'leadingComments', 'trailingComments']);

/** Recursively collect closures (arrow functions / function expressions) in an expression. */
function collectClosuresInExpression(expr: Rule.Node): Rule.Node[] {
  const closures: Rule.Node[] = [];

  function visit(n: Rule.Node) {
    if (n.type === 'ArrowFunctionExpression' || n.type === 'FunctionExpression') {
      closures.push(n);
      return; // scope.through on this closure already covers nested closures
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

/** Unwrap a TSParameterProperty to its inner Identifier (through a default value if present). */
function getParameterPropertyIdentifier(param: TSParameterPropertyNode): Rule.Node | undefined {
  let inner = param.parameter;
  if (inner.type === 'AssignmentPattern' && inner.left) {
    inner = inner.left;
  }
  return inner.type === 'Identifier' ? inner : undefined;
}

/** Find the enclosing constructor FunctionExpression, if any. */
function getEnclosingConstructor(node: Rule.Node): Rule.Node | undefined {
  let current: Rule.Node | null = node.parent as Rule.Node | null;
  while (current) {
    // Arrow functions do not bind super — a super() inside an arrow still
    // belongs to the enclosing constructor, so keep walking up through them.
    if (current.type === 'FunctionExpression' || current.type === 'FunctionDeclaration') {
      const parent = current.parent as (Rule.Node & { kind?: string }) | null;
      if (current.type === 'FunctionExpression' && parent?.type === 'MethodDefinition' && parent.kind === 'constructor') {
        return current;
      }
      return undefined; // plain functions rebind super; a super() here is not this constructor's
    }
    current = current.parent as Rule.Node | null;
  }
  return undefined;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Closures passed to super(...) must not reference constructor parameter properties; transpilers older than 1.32.0 lose the capture',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      superArgClosureCtorParamCapture:
        'Closure passed to super(...) references constructor parameter property "{{name}}". hsc < 1.32.0 does not capture parameter properties in closures, so "{{name}}" is invalid when the closure runs on device. Fixed in hsc 1.32.0. To stay compatible with older toolchains: declare "{{name}}" as a plain parameter (drop the private/public/protected/readonly modifier) and assign it to a field after super(), or reference this.{{name}} if the closure only runs after construction completes.',
    },
  },
  create: function (context) {
    return {
      CallExpression: function (node) {
        if ((node.callee as Rule.Node).type !== 'Super') return;

        const ctor = getEnclosingConstructor(node as Rule.Node);
        if (!ctor) return;

        const paramPropertyIds = (ctor as Rule.Node & { params: Rule.Node[] }).params
          .filter((p) => p.type === 'TSParameterProperty')
          .map((p) => getParameterPropertyIdentifier(p as TSParameterPropertyNode))
          .filter((id): id is Rule.Node => id !== undefined);
        if (paramPropertyIds.length === 0) return;

        for (const arg of node.arguments) {
          for (const closure of collectClosuresInExpression(arg as Rule.Node)) {
            const scope = context.sourceCode.getScope(closure);
            // scope.through holds references (from this closure and any nested
            // ones) that resolve outside the closure — exactly the captures.
            for (const ref of scope.through) {
              const resolved = ref.resolved;
              if (!resolved) continue;
              if (!resolved.identifiers.some((id) => paramPropertyIds.includes(id as Rule.Node))) continue;
              context.report({
                node: ref.identifier as Rule.Node,
                messageId: 'superArgClosureCtorParamCapture',
                data: { name: resolved.name },
              });
            }
          }
        }
      },
    };
  },
};

export default rule;
