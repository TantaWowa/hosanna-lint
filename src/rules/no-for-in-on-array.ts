import { Rule, Scope } from 'eslint';
import * as ts from 'typescript';

/**
 * HS-1033: The transpiler only warns about for-in on ARRAYS, not on objects.
 * for-in on objects is perfectly fine. We use type info when available, and
 * heuristic checks when not.
 */
const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'HS-1033: Warn about for...in on arrays. Using for...in over arrays is discouraged in BrightScript; use for...of for values or a numeric for loop for indices.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      forInOnArray:
        'HS-1033: Using "for...in" over an array is discouraged. Use "for...of" for values or a numeric "for" loop for indices.',
    },
  },
  create: function (context) {
    const parserServices = context.sourceCode?.parserServices as
      | { program?: ts.Program; getTypeAtLocation?: (node: Rule.Node) => ts.Type }
      | undefined;

    const hasTypeInfo =
      parserServices?.program && typeof parserServices.getTypeAtLocation === 'function';

    return {
      ForInStatement: function (node) {
        const right = node.right;

        if (hasTypeInfo) {
          try {
            const checker = parserServices!.program!.getTypeChecker();
            const rightType = parserServices!.getTypeAtLocation!(right as Rule.Node);
            if (checker.isArrayType(rightType) || checker.isTupleType(rightType)) {
              context.report({ node, messageId: 'forInOnArray' });
            }
          } catch {
            // Fall through to heuristic
          }
          return;
        }

        // Without type info, use heuristic: only flag if right side is array literal or
        // variable known to be initialized as array
        if (right.type === 'ArrayExpression') {
          context.report({ node, messageId: 'forInOnArray' });
          return;
        }

        if (right.type === 'Identifier') {
          const scope = context.sourceCode.getScope(right);
          const variable = scope.variables.find((v: Scope.Variable) => v.name === right.name);
          if (variable && variable.defs.length > 0) {
            const def = variable.defs[0];
            if (
              def.node.type === 'VariableDeclarator' &&
              def.node.init?.type === 'ArrayExpression'
            ) {
              context.report({ node, messageId: 'forInOnArray' });
            }
          }
        }
      },
    };
  },
};

export default rule;
