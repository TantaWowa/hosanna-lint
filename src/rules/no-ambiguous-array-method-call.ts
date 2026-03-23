import { Rule } from 'eslint';
import * as ts from 'typescript';
import { SUPPORTED_ARRAY_INSTANCE_METHODS } from '@tantawowa/hosanna-supported-apis';

const ARRAY_METHODS = new Set<string>(SUPPORTED_ARRAY_INSTANCE_METHODS as readonly string[]);

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'HS-1069: Flag array-shaped method calls on `any` / `unknown` where the transpiler cannot prove an array receiver.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      ambiguousArrayMethod:
        'HS-1069: PossibleArrayMethodInvocationOnAmiguousType: The method "{{method}}" looks like an array method, but the type of the object is ambiguous ({{type}}). If this is an array, add type information.',
    },
  },
  create(context) {
    const parserServices = context.sourceCode?.parserServices as
      | { program?: ts.Program; getTypeAtLocation?: (node: Rule.Node) => ts.Type }
      | undefined;

    const hasTypeInfo =
      parserServices?.program && typeof parserServices.getTypeAtLocation === 'function';

    return {
      CallExpression(node) {
        if (!hasTypeInfo) return;
        if (
          node.callee.type !== 'MemberExpression' ||
          node.callee.property.type !== 'Identifier' ||
          node.callee.computed
        ) {
          return;
        }
        const methodName = node.callee.property.name;
        if (!ARRAY_METHODS.has(methodName)) return;

        try {
          const objectType = parserServices!.getTypeAtLocation!(node.callee.object as Rule.Node);
          const checker = parserServices!.program!.getTypeChecker();

          if (!(objectType.flags & ts.TypeFlags.Any) && !(objectType.flags & ts.TypeFlags.Unknown)) {
            return;
          }

          context.report({
            node: node.callee.property,
            messageId: 'ambiguousArrayMethod',
            data: { method: methodName, type: checker.typeToString(objectType) },
          });
        } catch {
          // skip
        }
      },
    };
  },
};

export default rule;
