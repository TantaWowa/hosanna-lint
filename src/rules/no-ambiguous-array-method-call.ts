import { Rule } from 'eslint';
import * as ts from 'typescript';
import { SUPPORTED_ARRAY_INSTANCE_METHODS } from '@tantawowa/hosanna-supported-apis';
import {
  getCachedTypeAtLocation,
  getCachedTypeChecker,
  getTypeAwareParserServices,
} from '../utils/type-aware-cache';

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
    const parserServices = getTypeAwareParserServices(context);

    return {
      CallExpression(node) {
        if (!parserServices) return;
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
          const objectType = getCachedTypeAtLocation(context.sourceCode, parserServices, node.callee.object as Rule.Node);
          const checker = getCachedTypeChecker(parserServices.program);

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
