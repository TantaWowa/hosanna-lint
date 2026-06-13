import { Rule } from 'eslint';
import { shouldReportUndeclaredMemberWriteOnCallableReference } from '../utils/callable-member-assignment-utils';
import {
  getCachedTypeAtLocation,
  getCachedTypeChecker,
  getTypeAwareParserServices,
} from '../utils/type-aware-cache';

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
    const parserServices = getTypeAwareParserServices(context);

    function checkMemberWrite(memberNode: Rule.Node): void {
      if (!parserServices || memberNode.type !== 'MemberExpression') return;
      const me = memberNode as Rule.Node & { computed: boolean; object: Rule.Node; property: Rule.Node };
      try {
        const checker = getCachedTypeChecker(parserServices.program);
        const objectType = getCachedTypeAtLocation(context.sourceCode, parserServices, me.object);
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
