import { Rule } from 'eslint';

/** Known native Roku/BrightScript functions that must not be invoked through closure or variadic path */
const KNOWN_NATIVE_ROKU_FUNCTIONS = new Set(['CreateObject']);

/**
 * Extract the identifier name from a callee expression.
 * Handles: Identifier, TSAsExpression, TSTypeAssertion, and similar wrappers.
 */
function getCalleeIdentifierName(callee: Rule.Node): string | null {
  let node = callee as Rule.Node & { expression?: Rule.Node; type?: string };
  while (node) {
    const nodeType = (node as { type?: string }).type;
    if (nodeType === 'Identifier') {
      return (node as { name?: string }).name ?? null;
    }
    if (nodeType === 'TSAsExpression' || nodeType === 'TSTypeAssertion') {
      node = (node as { expression?: Rule.Node }).expression as Rule.Node & { expression?: Rule.Node };
      continue;
    }
    break;
  }
  return null;
}

/**
 * HS-1115: Native Roku functions (e.g. CreateObject) must not be invoked through
 * closure or variadic path. Native functions expect direct argument passing.
 */
const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'HS-1115: Disallow native Roku functions (e.g. CreateObject) invoked through closure or variadic path. Native functions expect direct argument passing.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      nativeFunctionClosureOrVariadicInvocation:
        'HS-1115: Native Roku function "{{functionName}}" is invoked through a closure or variadic path. Native functions expect direct argument passing; this may cause incorrect behavior at runtime. Call the function directly instead.',
    },
  },
  create: function (context) {
    /**
     * If the variable references a known native function, return that function name; otherwise null.
     */
    function getNativeFunctionNameFromVariable(varName: string, node: Rule.Node): string | null {
      let scope: import('eslint').Scope.Scope | null = context.sourceCode.getScope(node);
      while (scope) {
        const variable = scope.variables.find((v) => v.name === varName);
        if (variable) {
          const def = variable.defs[0];
          if (!def?.node) return null;
          const init = (def.node as { init?: Rule.Node }).init;
          if (!init) return null;
          const name = getCalleeIdentifierName(init);
          return name != null && KNOWN_NATIVE_ROKU_FUNCTIONS.has(name) ? name : null;
        }
        scope = scope.upper ?? null;
      }
      return null;
    }

    /**
     * Check if the call has a SpreadElement in arguments.
     */
    function hasSpreadInArguments(args: Rule.Node[]): boolean {
      return args.some((a) => (a as { type?: string }).type === 'SpreadElement');
    }

    return {
      CallExpression: function (node) {
        const callNode = node as Rule.Node & { callee: Rule.Node; arguments: Rule.Node[] };
        const callee = callNode.callee;
        const args = callNode.arguments ?? [];

        const calleeName = getCalleeIdentifierName(callee);
        if (!calleeName) return;

        const isDirectNativeCall = KNOWN_NATIVE_ROKU_FUNCTIONS.has(calleeName);
        const closureResolvedName = getNativeFunctionNameFromVariable(calleeName, callNode);
        const isClosurePath = !isDirectNativeCall && closureResolvedName != null;
        const hasSpread = hasSpreadInArguments(args);

        if (isClosurePath || (isDirectNativeCall && hasSpread)) {
          const displayName = closureResolvedName ?? calleeName;
          context.report({
            node: callee,
            messageId: 'nativeFunctionClosureOrVariadicInvocation',
            data: { functionName: displayName },
          });
        }
      },
    };
  },
};

export default rule;
