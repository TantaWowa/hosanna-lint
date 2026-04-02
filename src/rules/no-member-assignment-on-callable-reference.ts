import { Rule } from 'eslint';
import * as ts from 'typescript';
import { shouldReportUndeclaredMemberWriteOnCallableReference } from '../utils/callable-member-assignment-utils';

/**
 * HS-1121: Assigning to a property on a function pointer or constructor reference is invalid on Roku
 * (BrightScript function pointers cannot carry dynamic properties).
 */

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'HS-1121: Do not assign to properties on function pointers or constructor references; use a map or module scope instead.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      noMemberOnCallable:
        'HS-1121: BrightScript represents function and constructor references as plain function pointers; you cannot attach arbitrary properties. Store side data in a separate map, an object wrapper, or module scope instead.',
    },
  },
  create: function (context) {
    const parserServices = context.sourceCode?.parserServices as
      | { program?: ts.Program; getTypeAtLocation?: (node: Rule.Node) => ts.Type }
      | undefined;

    const hasTypeInfo =
      parserServices?.program && typeof parserServices.getTypeAtLocation === 'function';

    function checkMemberWrite(memberNode: Rule.Node): void {
      if (!hasTypeInfo || memberNode.type !== 'MemberExpression') return;
      const me = memberNode as Rule.Node & { computed: boolean; object: Rule.Node; property: Rule.Node };
      try {
        const checker = parserServices!.program!.getTypeChecker();
        const objectType = parserServices!.getTypeAtLocation!(me.object);
        if (
          !shouldReportUndeclaredMemberWriteOnCallableReference(checker, objectType, {
            computed: me.computed,
            property: me.property,
          })
        ) {
          return;
        }
        context.report({ node: memberNode, messageId: 'noMemberOnCallable' });
      } catch {
        /* skip */
      }
    }

    return {
      AssignmentExpression: function (node) {
        if (node.left.type !== 'MemberExpression') return;
        checkMemberWrite(node.left as Rule.Node);
      },
      UpdateExpression: function (node) {
        if (node.argument.type !== 'MemberExpression') return;
        checkMemberWrite(node.argument as Rule.Node);
      },
    };
  },
};

export default rule;
