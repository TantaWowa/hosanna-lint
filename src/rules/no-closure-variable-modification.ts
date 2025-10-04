import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Detects modification of closure variables within nested functions',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      closureVariableModification: 'Closure variables cannot be modified in Hosanna/BrightScript. If you need to do this, hoist this variable into an object, and modify the object property instead.',
    },
  },
  create: function (context) {
    let functionDepth = 0;

    return {
      // Track function depth
      'FunctionDeclaration, FunctionExpression, ArrowFunctionExpression': function () {
        functionDepth++;
      },
      'FunctionDeclaration:exit, FunctionExpression:exit, ArrowFunctionExpression:exit': function () {
        functionDepth--;
      },

      // Check for assignments in nested functions
      AssignmentExpression: function (node) {
        if (functionDepth > 1) {
          // We're in a nested function - any assignment could potentially be problematic
          if (node.left.type === 'Identifier') {
            context.report({
              node,
              messageId: 'closureVariableModification',
            });
          }
        }
      },

      // Also check update expressions (++, --) in nested functions
      UpdateExpression: function (node) {
        if (functionDepth > 1) {
          if (node.argument.type === 'Identifier') {
            context.report({
              node,
              messageId: 'closureVariableModification',
            });
          }
        }
      },
    };
  },
};

export default rule;
