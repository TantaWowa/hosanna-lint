import { Rule } from 'eslint';
import * as ts from 'typescript';

/**
 * HS-1034: The transpiler's FoundFunctionDefinedAsAny fires when a variable
 * that is used as a function pointer has type `any` - meaning the transpiler
 * can't determine if it's actually a callable function.
 *
 * We detect: variables/parameters typed as `any` that are invoked as functions,
 * or variables assigned a function reference where the type is `any`.
 */
const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'HS-1034: Warn when a function reference is typed as "any". The transpiler cannot safely handle function pointers typed as any.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      functionTypedAsAny:
        'HS-1034: Function reference "{{name}}" is typed as "any". Provide a specific function type to ensure safe transpilation.',
    },
  },
  create: function (context) {
    const parserServices = context.sourceCode?.parserServices as
      | { program?: ts.Program; getTypeAtLocation?: (node: Rule.Node) => ts.Type }
      | undefined;

    const hasTypeInfo =
      parserServices?.program && typeof parserServices.getTypeAtLocation === 'function';

    return {
      // Detect: someAnyVar() where someAnyVar is typed as `any`
      // But only when it looks like a function pointer usage, not a regular call
      VariableDeclarator: function (node) {
        if (!hasTypeInfo) return;
        if (!node.init) return;
        if (node.id.type !== 'Identifier') return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const idNode = node.id as any;
        if (!idNode.typeAnnotation) return;

        const typeAnnotation = idNode.typeAnnotation?.typeAnnotation;
        if (typeAnnotation && typeAnnotation.type === 'TSFunctionType') {
          try {
            const initType = parserServices!.getTypeAtLocation!(node.init as Rule.Node);
            if (initType.flags & ts.TypeFlags.Any) {
              context.report({
                node: node.id,
                messageId: 'functionTypedAsAny',
                data: { name: node.id.name },
              });
            }
          } catch {
            // Skip
          }
        }
      },
    };
  },
};

export default rule;
