import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow inline class declarations as classes must be declared at the top level',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      inlineClassNotAllowed: 'Inline classes are not allowed. Classes must be declared at the top level of the file.',
    },
  },
  create: function (context) {
    let inFunction = false;
    let inMethod = false;

    return {
      FunctionDeclaration: function () {
        inFunction = true;
      },
      'FunctionDeclaration:exit': function () {
        inFunction = false;
      },

      FunctionExpression: function () {
        inFunction = true;
      },
      'FunctionExpression:exit': function () {
        inFunction = false;
      },

      ArrowFunctionExpression: function () {
        inFunction = true;
      },
      'ArrowFunctionExpression:exit': function () {
        inFunction = false;
      },

      MethodDefinition: function () {
        inMethod = true;
      },
      'MethodDefinition:exit': function () {
        inMethod = false;
      },

      ClassDeclaration: function (node) {
        // Check if we're inside a function or method
        if (inFunction || inMethod) {
          context.report({
            node,
            messageId: 'inlineClassNotAllowed',
          });
        }
      },

      ClassExpression: function (node) {
        // Class expressions are also not allowed in functions/methods
        if (inFunction || inMethod) {
          context.report({
            node,
            messageId: 'inlineClassNotAllowed',
          });
        }
      },
    };
  },
};

export default rule;
