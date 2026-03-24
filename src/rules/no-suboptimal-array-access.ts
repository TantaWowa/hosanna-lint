import { Rule } from 'eslint';
import * as ts from 'typescript';

/**
 * HS-1042/1043/1044: The transpiler flags these only in specific ambiguous
 * scenarios. We only flag when the type checker provides clear evidence of
 * a mismatch (e.g. string literal key on a confirmed array type), or when
 * the receiver's **outermost** type assertion is `any` / `as unknown` with a non-literal key (HS-1044).
 * Chains like `(x as unknown as Record<string, unknown>)[k]` are excluded — the compiler sees an index signature, not ambiguous unknown.
 */
function unwrapToInnerExpression(node: Rule.Node): Rule.Node {
  let n: Rule.Node | undefined = node;
  // Use loose casts: Rule.Node includes ESTree nodes where `expression` is not always a Node (e.g. ArrowFunctionExpression).
  while (n && (n as { type?: string }).type === 'ParenthesizedExpression') {
    n = (n as { expression?: Rule.Node }).expression;
  }
  while (n && (n as { type?: string }).type === 'TSNonNullExpression') {
    n = (n as { expression?: Rule.Node }).expression;
  }
  return n ?? node;
}

/** True only when the outermost TSAsExpression / TSSatisfiesExpression is asserted to `any` or `unknown`. */
function isOutermostAssertionAnyOrUnknown(expr: Rule.Node | null | undefined): boolean {
  if (expr == null) return false;
  const n = unwrapToInnerExpression(expr);
  const t = (n as { type?: string }).type;
  if (t === 'TSAsExpression' || t === 'TSSatisfiesExpression') {
    const ann = (n as { typeAnnotation?: { type?: string } }).typeAnnotation;
    return ann?.type === 'TSAnyKeyword' || ann?.type === 'TSUnknownKeyword';
  }
  return false;
}

function isStringOrNumberLiteralProperty(prop: Rule.Node & { type?: string; value?: unknown }): boolean {
  if (prop.type === 'Literal') {
    return typeof prop.value === 'string' || typeof prop.value === 'number';
  }
  return false;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'HS-1042/HS-1044: Warn about ambiguous array/computed access (non-numeric string on arrays; outermost any/unknown assertion with dynamic keys).',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      arrayWithNonNumericStringLiteral:
        'HS-1042_1: Cannot access array with non-numeric string literal "{{key}}". Arrays must be accessed with numeric indices.',
      ambiguousAnyUnknownAccess:
        'HS-1044: SubOptimalArrayAccesss_AmbiguousAccess: Ambiguous member access; using hs_safeKey for runtime key resolution. Specify types for better performance.',
    },
  },
  create: function (context) {
    const parserServices = context.sourceCode?.parserServices as
      | { program?: ts.Program; getTypeAtLocation?: (node: Rule.Node) => ts.Type }
      | undefined;

    const hasTypeInfo =
      parserServices?.program && typeof parserServices.getTypeAtLocation === 'function';

    return {
      MemberExpression: function (node) {
        if (!node.computed) return;

        const innerObject = unwrapToInnerExpression(node.object as Rule.Node);

        // HS-1044: outermost (x as any|unknown)[non-literal] — aligns with transpiler when type stays any/unknown
        if (!isStringOrNumberLiteralProperty(node.property as Rule.Node & { type?: string; value?: unknown })) {
          if (isOutermostAssertionAnyOrUnknown(innerObject)) {
            context.report({
              node,
              messageId: 'ambiguousAnyUnknownAccess',
            });
          }
        }

        if (!hasTypeInfo) return;

        // HS-1042_1: string literal key on array/tuple
        if (node.property.type !== 'Literal' || typeof (node.property as { value?: unknown }).value !== 'string') {
          return;
        }

        const stringKey = (node.property as { value: string }).value;
        if (!isNaN(Number(stringKey))) return;

        try {
          const checker = parserServices!.program!.getTypeChecker();
          const objectType = parserServices!.getTypeAtLocation!(node.object as Rule.Node);

          if (checker.isArrayType(objectType) || checker.isTupleType(objectType)) {
            context.report({
              node,
              messageId: 'arrayWithNonNumericStringLiteral',
              data: { key: stringKey },
            });
          }
        } catch {
          // Skip
        }
      },
    };
  },
};

export default rule;
