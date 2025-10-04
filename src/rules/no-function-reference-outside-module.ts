import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Detects function references assigned to variables outside modules or classes',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      functionReferenceOutsideModule: 'Variables which are function references are only allowed inside modules or classes in Hosanna/BrightScript.',
    },
  },
  create: function (context) {
    let inFunction = false;
    let inClass = false;
    const inModule = false;

    return {
      // Track when we're inside various constructs
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

      ClassDeclaration: function () {
        inClass = true;
      },
      'ClassDeclaration:exit': function () {
        inClass = false;
      },

      ClassExpression: function () {
        inClass = true;
      },
      'ClassExpression:exit': function () {
        inClass = false;
      },

      // Check for top-level variable declarations with function references
      VariableDeclaration: function (node) {
        // Only check if we're at the top level (not inside functions, classes, or modules)
        if (!inFunction && !inClass && !inModule) {
          for (const declarator of node.declarations) {
            if (
              declarator.init &&
              (declarator.init.type === 'FunctionExpression' ||
               declarator.init.type === 'ArrowFunctionExpression')
            ) {
              context.report({
                node: declarator,
                messageId: 'functionReferenceOutsideModule',
              });
            }
          }
        }
      },

      // Also check assignment expressions
      AssignmentExpression: function (node) {
        // Only check if we're at the top level
        if (!inFunction && !inClass && !inModule) {
          if (
            node.right &&
            (node.right.type === 'FunctionExpression' ||
             node.right.type === 'ArrowFunctionExpression')
          ) {
            context.report({
              node,
              messageId: 'functionReferenceOutsideModule',
            });
          }
        }
      },
    };
  },
};

export default rule;
