import { Rule } from 'eslint';
import { SUPPORTED_DESTRUCTURING_PARENT_TYPES } from '@tantawowa/hosanna-supported-apis';

const SUPPORTED_PARENT_TYPES = new Set<string>(SUPPORTED_DESTRUCTURING_PARENT_TYPES);

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'HS-1040/1041: Disallow destructuring in unsupported contexts. Only function parameters and variable declarations support destructuring.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      objectDestructuringUnsupported:
        'HS-1040: Object destructuring is not supported in this context. Only function parameters and variable declarations can use destructuring.',
      arrayDestructuringUnsupported:
        'HS-1041: Array destructuring is not supported in this context. Only function parameters and variable declarations can use destructuring.',
    },
  },
  create: function (context) {
    function checkPattern(node: Rule.Node, messageId: string) {
      const parent = node.parent;
      if (!parent) return;

      if (SUPPORTED_PARENT_TYPES.has(parent.type)) return;

      // Method definitions (class methods) — patterns in params
      if (parent.type === 'Property' && parent.parent?.type === 'ObjectPattern') return;
      if (parent.type === 'RestElement') return;
      if (parent.type === 'ArrayPattern') return;
      if (parent.type === 'AssignmentPattern') {
        // Check if this AssignmentPattern is inside a supported context
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let current: any = parent.parent;
        while (current) {
          if (SUPPORTED_PARENT_TYPES.has(current.type)) return;
          if (current.type === 'ArrayPattern' || current.type === 'ObjectPattern') {
            current = current.parent;
            continue;
          }
          break;
        }
      }

      context.report({ node, messageId });
    }

    return {
      ObjectPattern: function (node) {
        checkPattern(node, 'objectDestructuringUnsupported');
      },
      ArrayPattern: function (node) {
        checkPattern(node, 'arrayDestructuringUnsupported');
      },
    };
  },
};

export default rule;
