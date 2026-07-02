import { Rule } from 'eslint';

/**
 * Compat guard for hsc < 1.32.0 (fixed by transpiler commit a354b70).
 *
 * Babel does not register scope bindings for TSParameterProperty params
 * (constructor parameter properties such as `constructor(private x: T)`).
 * The closure-capture machinery resolves capture owners via
 * `scope.hasOwnBinding`, so before the fix ANY closure created inside the
 * constructor that referenced a parameter property lost the capture — the
 * bare identifier leaked into the generated BrightScript and was invalid at
 * call time. The failure was reported for super(...) arguments, but the
 * mechanism applies to the whole constructor body. Plain (unmodified)
 * constructor params always had bindings and were captured correctly.
 *
 * Guidance differs by position:
 * - In super(...) args, `this` is not yet available and TS forbids statements
 *   before super() when parameter properties exist — the only rewrite is a
 *   plain parameter.
 * - After super(), parameter properties are already assigned to `this`, so
 *   `this.x` is a mechanical, safe replacement (offered as a suggestion when
 *   every enclosing closure up to the constructor is an arrow function).
 */

/* TSParameterProperty is a @typescript-eslint AST node, absent from ESLint's core Node union */
interface TSParameterPropertyLike {
  type: string;
  parameter: { type: string; left?: { type: string } };
}

/** Keys to skip when traversing AST - avoid circular refs (parent) and non-AST data */
const SKIP_KEYS = new Set(['parent', 'loc', 'range', 'leadingComments', 'trailingComments']);

/** Recursively collect outermost closures (arrow functions / function expressions) in a subtree. */
function collectClosures(root: Rule.Node): Rule.Node[] {
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
  visit(root);
  return closures;
}

/** Unwrap a TSParameterProperty to its inner Identifier (through a default value if present). */
function getParameterPropertyIdentifier(param: TSParameterPropertyLike): Rule.Node | undefined {
  let inner = param.parameter;
  if (inner.type === 'AssignmentPattern' && inner.left) {
    inner = inner.left;
  }
  return inner.type === 'Identifier' ? (inner as unknown as Rule.Node) : undefined;
}

/** True when `node` sits inside the arguments of a super(...) call within `ctor`. */
function isInsideSuperArgs(node: Rule.Node, ctor: Rule.Node): boolean {
  let current: Rule.Node | null = node.parent as Rule.Node | null;
  while (current && current !== ctor) {
    if (current.type === 'CallExpression' && (current.callee as Rule.Node).type === 'Super') {
      return true;
    }
    current = current.parent as Rule.Node | null;
  }
  return false;
}

/**
 * True when every function between `node` and `ctor` (exclusive) is an arrow
 * function — i.e. `this` inside the closure is the constructed instance.
 */
function thisReachesConstructor(node: Rule.Node, ctor: Rule.Node): boolean {
  let current: Rule.Node | null = node.parent as Rule.Node | null;
  while (current && current !== ctor) {
    if (current.type === 'FunctionExpression' || current.type === 'FunctionDeclaration') {
      return false;
    }
    current = current.parent as Rule.Node | null;
  }
  return true;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Closures inside a constructor must not reference constructor parameter properties; transpilers older than 1.32.0 lose the capture',
      category: 'Best Practices',
      recommended: true,
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      superArgClosureCtorParamCapture:
        'Closure passed to super(...) references constructor parameter property "{{name}}". hsc < 1.32.0 does not capture parameter properties in closures, so "{{name}}" is invalid when the closure runs on device. Fixed in hsc 1.32.0. To stay compatible with older toolchains: declare "{{name}}" as a plain parameter (drop the private/public/protected/readonly modifier) and assign it to a field after super(), or reference this.{{name}} if the closure only runs after construction completes.',
      ctorBodyClosureCtorParamCapture:
        'Closure inside the constructor references constructor parameter property "{{name}}". hsc < 1.32.0 does not capture parameter properties in closures, so "{{name}}" is invalid when the closure runs on device. Fixed in hsc 1.32.0. To stay compatible with older toolchains, reference this.{{name}} — parameter properties are already assigned by this point.',
      replaceWithThisReference: 'Replace "{{name}}" with "this.{{name}}"',
    },
  },
  create: function (context) {
    return {
      MethodDefinition: function (node) {
        if (node.kind !== 'constructor') return;
        const ctor = node.value as Rule.Node & { body?: Rule.Node };
        if (ctor.type !== 'FunctionExpression' || !ctor.body) return;

        const params = (ctor as unknown as { params: TSParameterPropertyLike[] }).params;
        const paramPropertyIds = params
          .filter((p) => p.type === 'TSParameterProperty')
          .map((p) => getParameterPropertyIdentifier(p))
          .filter((id): id is Rule.Node => id !== undefined);
        if (paramPropertyIds.length === 0) return;

        for (const closure of collectClosures(ctor.body)) {
          const scope = context.sourceCode.getScope(closure);
          // scope.through holds references (from this closure and any nested
          // ones) that resolve outside the closure — exactly the captures.
          for (const ref of scope.through) {
            const resolved = ref.resolved;
            if (!resolved) continue;
            if (!resolved.identifiers.some((id) => paramPropertyIds.includes(id as Rule.Node))) continue;

            const identifier = ref.identifier as Rule.Node;
            const name = resolved.name;
            if (isInsideSuperArgs(closure, ctor)) {
              context.report({
                node: identifier,
                messageId: 'superArgClosureCtorParamCapture',
                data: { name },
              });
              continue;
            }

            // After super(), parameter properties are assigned to `this`; the
            // rewrite is only offered when `this` in the closure is the instance.
            const canSuggestThis = thisReachesConstructor(identifier, ctor);
            context.report({
              node: identifier,
              messageId: 'ctorBodyClosureCtorParamCapture',
              data: { name },
              suggest: canSuggestThis
                ? [
                    {
                      messageId: 'replaceWithThisReference',
                      data: { name },
                      fix: (fixer) => {
                        const parent = identifier.parent as (Rule.Node & { shorthand?: boolean }) | null;
                        if (parent?.type === 'Property' && parent.shorthand) {
                          return fixer.replaceText(parent, `${name}: this.${name}`);
                        }
                        return fixer.replaceText(identifier, `this.${name}`);
                      },
                    },
                  ]
                : undefined,
            });
          }
        }
      },
    };
  },
};

export default rule;
