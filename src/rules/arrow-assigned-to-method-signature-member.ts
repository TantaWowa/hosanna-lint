import { Rule } from 'eslint';
import * as ts from 'typescript';
import { getCachedTypeChecker } from '../utils/type-aware-cache';

/**
 * HS-1128: an arrow function or function expression value assigned to an object-literal property
 * whose contextual-type member is a `ts.MethodSignature`. On Roku such values transpile to an
 * `hs_function_create(...)` closure OBJECT, but the method-signature declared type makes call sites
 * emit a bare `obj.member()` call → "Function Call Operator ( ) attempted on non-function" crash.
 *
 * Detection mirrors the transpiler's HS-1128 (TSProgram.doPostProcessing object-literal branch).
 * Cases flagged:
 *   - `{ make: () => 'hi' }`           — inline ArrowFunctionExpression
 *   - `{ make: function () {} }`       — inline FunctionExpression
 *   - `{ make: makeImpl }`             — identifier resolving to a same-file `const` arrow/funcExpr
 *   - `{ make }`                       — shorthand whose identifier resolves to same
 *   - `{ ['make']: () => 'hi' }`       — literal computed key (string or numeric)
 * Cases NOT flagged: `{ make: () => T }` typed as a property-of-function-type (the fix shape),
 * method shorthand `{ make() {} }`, untyped object literals, identifiers resolving to a function
 * declaration (raw function — works), and class-instance backings.
 */

type ParserServicesWithTSBridge = {
  program?: ts.Program;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  esTreeNodeToTSNodeMap?: { get(node: any): ts.Node | undefined };
};

type EstreePropertyLike = {
  type?: string;
  key?: { type?: string };
  value?: { type?: string };
  computed?: boolean;
  method?: boolean;
};

/** True iff `decl` is a `const x = (arrow|funcExpr)` style declaration. */
function isVariableDeclWithFunctionInitializer(decl: ts.Declaration | undefined): boolean {
  return (
    !!decl &&
    ts.isVariableDeclaration(decl) &&
    !!decl.initializer &&
    (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer))
  );
}

function hasStaticPropertyKey(prop: EstreePropertyLike): boolean {
  if (prop.computed) {
    return prop.key?.type === 'Literal';
  }
  return prop.key?.type === 'Identifier' || prop.key?.type === 'Literal';
}

function hasFunctionLikePropertyCandidate(node: Rule.Node): boolean {
  const properties = (node as Rule.Node & { properties?: EstreePropertyLike[] }).properties ?? [];
  for (const prop of properties) {
    if (prop.type !== 'Property' || prop.method || !hasStaticPropertyKey(prop)) {
      continue;
    }
    const valueType = prop.value?.type;
    if (valueType === 'ArrowFunctionExpression' || valueType === 'FunctionExpression' || valueType === 'Identifier') {
      return true;
    }
  }
  return false;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'HS-1128: Disallow arrow / function-expression values (inline, identifier-resolved, or shorthand) assigned to object-literal properties whose contextual-type member is a method signature (causes Roku non-function crash).',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      arrowAssignedToMethodSignatureMember:
        "HS-1128: ArrowAssignedToMethodSignatureMember: '{{memberName}}' is declared as an interface/type METHOD " +
        '(e.g. {{memberName}}(): T) but is implemented with an arrow function or function expression. On Roku the ' +
        'value becomes a closure object, while method call sites emit a direct {{memberName}}() call, which crashes ' +
        'with "Function Call Operator ( ) attempted on non-function". Fix: declare the member as a function-typed ' +
        'PROPERTY ({{memberName}}: () => T) so call sites emit .call, OR back it with a class instance / named ' +
        'function declaration.',
    },
  },
  create: function (context) {
    const parserServices = context.sourceCode?.parserServices as ParserServicesWithTSBridge | undefined;
    const hasTypeInfo = !!parserServices?.program && !!parserServices?.esTreeNodeToTSNodeMap;

    return {
      ObjectExpression: function (node) {
        if (!hasTypeInfo) return;
        if (!hasFunctionLikePropertyCandidate(node as Rule.Node)) return;
        try {
          const checker = getCachedTypeChecker(parserServices!.program!);
          const tsNode = parserServices!.esTreeNodeToTSNodeMap!.get(node);
          if (!tsNode || !ts.isObjectLiteralExpression(tsNode)) return;
          const contextualType = checker.getContextualType(tsNode);
          if (!contextualType) return;

          for (const tsProp of tsNode.properties) {
            // Resolve the property name (Identifier / StringLiteral / NumericLiteral, plus literal
            // ComputedPropertyName like `['make']` or `[0]`).
            let keyText: string | undefined;
            if (ts.isPropertyAssignment(tsProp) || ts.isShorthandPropertyAssignment(tsProp)) {
              const name = tsProp.name;
              if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
                keyText = name.text;
              } else if (ts.isComputedPropertyName(name)) {
                const expr = name.expression;
                if (ts.isStringLiteral(expr) || ts.isNumericLiteral(expr)) {
                  keyText = expr.text;
                }
              }
            }
            if (!keyText) continue;

            // Determine if the value is (or resolves to) an arrow / function expression. Anchor the
            // report at the most-specific node so the squiggle points at the misuse.
            let anchor: ts.Node | undefined;
            if (ts.isPropertyAssignment(tsProp)) {
              const init = tsProp.initializer;
              if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) {
                anchor = init;
              } else if (ts.isIdentifier(init)) {
                const symbol = checker.getSymbolAtLocation(init);
                const decl = symbol?.valueDeclaration ?? symbol?.declarations?.[0];
                if (isVariableDeclWithFunctionInitializer(decl)) anchor = init;
              }
            } else if (ts.isShorthandPropertyAssignment(tsProp)) {
              // `getSymbolAtLocation(prop.name)` returns the PROPERTY symbol for shorthand; use
              // the dedicated helper that resolves to the in-scope value.
              const valueSymbol = checker.getShorthandAssignmentValueSymbol(tsProp);
              const decl = valueSymbol?.valueDeclaration ?? valueSymbol?.declarations?.[0];
              if (isVariableDeclWithFunctionInitializer(decl)) anchor = tsProp.name;
            }
            if (!anchor) continue;

            const sym = checker.getPropertyOfType(contextualType, keyText);
            // `make(): T` declarations are MethodSignature; `make: () => T` are PropertySignature (NOT flagged).
            const isMethodSignature = sym?.declarations?.some(d => ts.isMethodSignature(d));
            if (isMethodSignature) {
              // Map the TS anchor back to an ESTree node for ESLint reporting. Fall back to the
              // ObjectExpression's location if the reverse map is unavailable.
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const tsToEs = (parserServices as any).tsNodeToESTreeNodeMap;
              const reportNode = (tsToEs?.get?.(anchor) as Rule.Node | undefined) ?? node;
              context.report({
                node: reportNode,
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
