import { Rule } from 'eslint';
import * as ts from 'typescript';
import { lintClassifyForInRhs } from '../utils/for-in-rhs-classify';

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'HS-1123: for-in RHS type is not a supported plain object/string pattern for Roku (hs_for_in_rhs empty iteration).',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      forInRhsUnsupportedType:
        'HS-1123: This for-in right-hand side type is not a supported plain object/string pattern for Roku. At runtime the value is passed through hs_for_in_rhs(); unsupported values become an empty iteration. Use a Record/object, string, or a SceneGraph node type (with the getFields caveat), or refactor.',
    },
  },
  create(context) {
    const parserServices = context.sourceCode?.parserServices as
      | { program?: ts.Program; getTypeAtLocation?: (node: Rule.Node) => ts.Type }
      | undefined;

    const hasTypeInfo =
      parserServices?.program && typeof parserServices.getTypeAtLocation === 'function';

    return {
      ForInStatement(node) {
        if (!hasTypeInfo) return;

        try {
          const checker = parserServices!.program!.getTypeChecker();
          const rightType = parserServices!.getTypeAtLocation!(node.right as Rule.Node);
          const cls = lintClassifyForInRhs(checker, rightType);
          if (cls === 'unsupported') {
            context.report({ node, messageId: 'forInRhsUnsupportedType' });
          }
        } catch {
          /* skip */
        }
      },
    };
  },
};

export default rule;
