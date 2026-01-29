import { Rule } from 'eslint';

/**
 * Check if a node contains any identifier matching the conditional flag pattern (__XXX__)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function containsConditionalFlag(node: any): boolean {
  if (!node) {
    return false;
  }

  // Check if this is an identifier matching the pattern
  if (node.type === 'Identifier') {
    const name = node.name;
    // Check if the identifier matches __XXX__ pattern (at least 2 underscores with something in between)
    if (/^__[A-Z_]+__$/.test(name)) {
      return true;
    }
  }

  // Recursively check children
  for (const key in node) {
    if (key === 'parent' || key === 'range' || key === 'loc') {
      continue;
    }
    const value = node[key];
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (containsConditionalFlag(item)) {
            return true;
          }
        }
      } else if (containsConditionalFlag(value)) {
        return true;
      }
    }
  }

  return false;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow else clauses in conditional compilation statements',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      conditionalCompilationElseNotSupported:
        'else clauses are not supported for conditional compilation statements. Split into separate flag checks instead. Conditional flags are defined in hsconfig.json under the buildFlags section.',
    },
  },
  create: function (context) {
    /**
     * Check if an IfStatement chain contains conditional flags and has else clauses
     * Reports errors for any else clauses when conditional flags are present
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function checkIfStatement(node: any) {
      if (!node || node.type !== 'IfStatement') {
        return;
      }

      const hasConditionalFlag = containsConditionalFlag(node.test);

      // If this if statement uses a conditional flag and has an alternate, report error
      if (hasConditionalFlag && node.alternate) {
        context.report({
          node: node.alternate,
          messageId: 'conditionalCompilationElseNotSupported',
        });
      }

      // Recursively check else-if chains
      if (node.alternate && node.alternate.type === 'IfStatement') {
        checkIfStatement(node.alternate);
      }
    }

    return {
      IfStatement: function (node) {
        checkIfStatement(node);
      },
    };
  },
};

export default rule;
