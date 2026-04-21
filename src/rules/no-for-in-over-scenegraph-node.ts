import { Rule } from 'eslint';
import * as ts from 'typescript';
import { lintClassifyForInRhs } from '../utils/for-in-rhs-classify';

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'HS-1122: for-in over SceneGraph node types lowers to getFields() key iteration on Roku; may not match JavaScript for-in.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      forInOverSceneGraphNode:
        'HS-1122: This for-in lowers to iterating keys from roSGNode.getFields() on Roku, which lists SceneGraph field names. That may not match JavaScript for-in enumeration (order, prototypes, descriptors). Prefer explicit field access or a plain associative array when you need JS-like semantics.',
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
          if (cls === 'sgnode') {
            context.report({ node, messageId: 'forInOverSceneGraphNode' });
          }
        } catch {
          /* skip */
        }
      },
    };
  },
};

export default rule;
