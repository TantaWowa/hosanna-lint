import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow nested function declarations as they are not supported in Hosanna',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      nestedFunctionNotSupported: 'Nested function declarations are not supported in Hosanna. Create a module level function, variable, arrow function, or class method instead.',
    },
  },
  create: function (context) {
    const functionStack: string[] = [];

    return {
      FunctionDeclaration: function (node) {
        // Track function declarations (but not at module level)
        if (functionStack.length > 0) {
          context.report({
            node,
            messageId: 'nestedFunctionNotSupported',
          });
        }
        functionStack.push('function');
      },
      'FunctionDeclaration:exit': function () {
        functionStack.pop();
      },

      FunctionExpression: function (_node) {
        // Track function expressions
        if (functionStack.length > 0) {
          context.report({
            node: _node,
            messageId: 'nestedFunctionNotSupported',
          });
        }
        functionStack.push('function');
      },
      'FunctionExpression:exit': function () {
        functionStack.pop();
      },

      ArrowFunctionExpression: function (_node) {
        // Track arrow functions
        functionStack.push('arrow');
      },
      'ArrowFunctionExpression:exit': function () {
        functionStack.pop();
      },

      // MethodDefinition covers class methods
      MethodDefinition: function (_node) {
        functionStack.push('method');
      },
      'MethodDefinition:exit': function () {
        functionStack.pop();
      },
    };
  },
};

export default rule;
