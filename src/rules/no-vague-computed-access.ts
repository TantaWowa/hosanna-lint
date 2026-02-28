import { Rule } from 'eslint';
import * as ts from 'typescript';

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'HS-1081: Warn about computed property access on objects that may have getters/setters/annotated fields.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      vagueComputedAccess:
        'HS-1081: Accessing properties via computed keys (e.g. obj[dynamicKey]) on this instance could lead to unsafe access of a getter, setter, or annotated field. Use direct property access instead, or cast to a concrete class.',
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
        if (!hasTypeInfo || !node.computed) return;
        if (node.property.type === 'Literal') return;

        try {
          const objectType = parserServices!.getTypeAtLocation!(node.object as Rule.Node);
          const checker = parserServices!.program!.getTypeChecker();

          if (objectType.flags & ts.TypeFlags.Any) return;
          if (checker.isArrayType(objectType)) return;

          if (hasGetterOrSetter(objectType, checker)) {
            context.report({ node, messageId: 'vagueComputedAccess' });
          }
        } catch {
          // Skip
        }
      },
    };
  },
};

function hasGetterOrSetter(type: ts.Type, checker: ts.TypeChecker): boolean {
  const properties = type.getProperties();
  for (const prop of properties) {
    const decls = prop.getDeclarations();
    if (!decls) continue;
    for (const decl of decls) {
      if (ts.isGetAccessorDeclaration(decl) || ts.isSetAccessorDeclaration(decl)) {
        return true;
      }
    }
  }

  const baseTypes = type.getBaseTypes?.();
  if (baseTypes) {
    for (const base of baseTypes) {
      if (hasGetterOrSetter(base, checker)) return true;
    }
  }

  void checker;
  return false;
}

export default rule;
