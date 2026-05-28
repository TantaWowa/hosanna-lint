import { Rule } from 'eslint';
import * as ts from 'typescript';

/**
 * HS-1128: an arrow function (or function expression) assigned to an object-literal property
 * whose contextual-type member is a `ts.MethodSignature`. On Roku the arrow transpiles to an
 * `hs_function_create(...)` closure OBJECT, but the method-signature declared type makes call sites
 * emit a bare `obj.member()` call → "Function Call Operator ( ) attempted on non-function" crash.
 *
 * Detection mirrors the transpiler's HS-1128 (TSProgram.doPostProcessing object-literal branch):
 * for each PropertyAssignment whose value is an Arrow/FunctionExpression, look up the property in
 * the object literal's contextual type; flag iff the property's declaration is a MethodSignature.
 * `make: () => T` produces a PropertySignature and is NOT flagged (the recommended fix shape).
 * Untyped object literals have no contextual type and are NOT flagged.
 */

type ParserServicesWithTSBridge = {
  program?: ts.Program;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  esTreeNodeToTSNodeMap?: { get(node: any): ts.Node | undefined };
};

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'HS-1128: Disallow arrow/function-expression values assigned to object-literal properties whose contextual-type member is a method signature (causes Roku non-function crash).',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      arrowAssignedToMethodSignatureMember:
        "HS-1128: ArrowAssignedToMethodSignatureMember: '{{memberName}}' is declared as an interface/type METHOD " +
        '(e.g. {{memberName}}(): T) but is implemented with an arrow function. On Roku the arrow becomes a ' +
        'closure object, while method call sites emit a direct {{memberName}}() call, which crashes with ' +
        '"Function Call Operator ( ) attempted on non-function". Fix: declare the member as a function-typed ' +
        'PROPERTY ({{memberName}}: () => T) so call sites emit .call, OR back it with a class instance / named function.',
    },
  },
  create: function (context) {
    const parserServices = context.sourceCode?.parserServices as ParserServicesWithTSBridge | undefined;
    const hasTypeInfo = !!parserServices?.program && !!parserServices?.esTreeNodeToTSNodeMap;

    return {
      ObjectExpression: function (node) {
        if (!hasTypeInfo) return;
        try {
          const checker = parserServices!.program!.getTypeChecker();
          const tsNode = parserServices!.esTreeNodeToTSNodeMap!.get(node);
          if (!tsNode || !ts.isObjectLiteralExpression(tsNode)) return;
          const contextualType = checker.getContextualType(tsNode);
          if (!contextualType) return;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const properties = (node as any).properties as any[];
          for (const prop of properties) {
            if (prop?.type !== 'Property') continue;
            // Skip method shorthand `{ make() {} }` (real raw function, not the bug),
            // shorthand `{ x }`, and computed keys `{ [k]: ... }`.
            if (prop.method || prop.shorthand || prop.computed) continue;
            const value = prop.value;
            if (!value) continue;
            if (value.type !== 'ArrowFunctionExpression' && value.type !== 'FunctionExpression') continue;

            const key = prop.key;
            let keyText: string | undefined;
            if (key?.type === 'Identifier') {
              keyText = key.name;
            } else if (
              key?.type === 'Literal' &&
              (typeof key.value === 'string' || typeof key.value === 'number')
            ) {
              keyText = String(key.value);
            }
            if (!keyText) continue;

            const sym = checker.getPropertyOfType(contextualType, keyText);
            // `make(): T` declarations are MethodSignature; `make: () => T` are PropertySignature (NOT flagged).
            const isMethodSignature = sym?.declarations?.some(d => ts.isMethodSignature(d));
            if (isMethodSignature) {
              context.report({
                node: value,
                messageId: 'arrowAssignedToMethodSignatureMember',
                data: { memberName: keyText },
              });
            }
          }
        } catch {
          // Skip silently if type analysis fails (mirrors no-getter-setter-mismatch.ts).
        }
      },
    };
  },
};

export default rule;
