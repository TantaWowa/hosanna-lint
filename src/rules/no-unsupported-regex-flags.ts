import { Rule } from 'eslint';

// Regex flags that are not supported in Hosanna/BrightScript
const UNSUPPORTED_FLAGS = new Set(['u', 'y']);

/**
 * Extract flags string from a node
 * Handles string literals and template literals (simple ones)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractFlags(node: any): string | null {
  if (!node) {
    return null;
  }

  // String literal
  if (node.type === 'Literal' && typeof node.value === 'string') {
    return node.value;
  }

  // Template literal (only if it's a simple one without expressions)
  if (node.type === 'TemplateLiteral') {
    if (node.expressions && node.expressions.length === 0 && node.quasis && node.quasis.length === 1) {
      const value = node.quasis[0].value.cooked || node.quasis[0].value.raw;
      if (typeof value === 'string') {
        return value;
      }
    }
  }

  return null;
}

/**
 * Check if flags string contains any unsupported flags
 */
function hasUnsupportedFlags(flags: string): boolean {
  for (const flag of flags) {
    if (UNSUPPORTED_FLAGS.has(flag)) {
      return true;
    }
  }
  return false;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow unsupported regex flags (u, y) in Hosanna',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      unsupportedRegexFlag: 'Regex flag "{{flag}}" is not supported in Hosanna/BrightScript.',
    },
  },
  create: function (context) {
    return {
      // Check regex literals: /pattern/flags
      Literal: function (node) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const literalNode = node as any;
        if (literalNode.regex) {
          const flags = literalNode.regex.flags || '';
          const reportedFlags = new Set<string>();
          for (const flag of flags) {
            if (UNSUPPORTED_FLAGS.has(flag) && !reportedFlags.has(flag)) {
              reportedFlags.add(flag);
              context.report({
                node,
                messageId: 'unsupportedRegexFlag',
                data: { flag },
              });
            }
          }
        }
      },

      // Check new RegExp(pattern, flags)
      NewExpression: function (node) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newExpr = node as any;
        if (
          newExpr.callee.type === 'Identifier' &&
          newExpr.callee.name === 'RegExp' &&
          newExpr.arguments &&
          newExpr.arguments.length >= 2
        ) {
          const flagsNode = newExpr.arguments[1];
          const flags = extractFlags(flagsNode);
          if (flags && hasUnsupportedFlags(flags)) {
            const reportedFlags = new Set<string>();
            for (const flag of flags) {
              if (UNSUPPORTED_FLAGS.has(flag) && !reportedFlags.has(flag)) {
                reportedFlags.add(flag);
                context.report({
                  node: flagsNode,
                  messageId: 'unsupportedRegexFlag',
                  data: { flag },
                });
              }
            }
          }
        }
      },

      // Check RegExp(pattern, flags) - constructor call without new
      CallExpression: function (node) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const callExpr = node as any;
        if (
          callExpr.callee.type === 'Identifier' &&
          callExpr.callee.name === 'RegExp' &&
          callExpr.arguments &&
          callExpr.arguments.length >= 2
        ) {
          const flagsNode = callExpr.arguments[1];
          const flags = extractFlags(flagsNode);
          if (flags && hasUnsupportedFlags(flags)) {
            const reportedFlags = new Set<string>();
            for (const flag of flags) {
              if (UNSUPPORTED_FLAGS.has(flag) && !reportedFlags.has(flag)) {
                reportedFlags.add(flag);
                context.report({
                  node: flagsNode,
                  messageId: 'unsupportedRegexFlag',
                  data: { flag },
                });
              }
            }
          }
        }
      },
    };
  },
};

export default rule;


