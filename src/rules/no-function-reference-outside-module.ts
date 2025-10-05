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
    return {
      // Check for top-level variable declarations with function references
      VariableDeclaration: function (node) {
        // Check if we're at the top level (not inside functions, classes, or modules)
        // In ESLint 9, getAncestors is not available, so we traverse the AST manually
        let current = node.parent;
        const ancestors = [];
        while (current) {
          ancestors.push(current);
          current = current.parent;
        }

        const isInsideFunction = ancestors.some((ancestor: Rule.Node) =>
          ancestor.type === 'FunctionDeclaration' ||
          ancestor.type === 'FunctionExpression' ||
          ancestor.type === 'ArrowFunctionExpression'
        );
        const isInsideClass = ancestors.some((ancestor: Rule.Node) =>
          ancestor.type === 'ClassDeclaration' ||
          ancestor.type === 'ClassExpression'
        );

        if (!isInsideFunction && !isInsideClass) {
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
        // Check if we're at the top level
        let current = node.parent;
        const ancestors = [];
        while (current) {
          ancestors.push(current);
          current = current.parent;
        }

        const isInsideFunction = ancestors.some((ancestor: Rule.Node) =>
          ancestor.type === 'FunctionDeclaration' ||
          ancestor.type === 'FunctionExpression' ||
          ancestor.type === 'ArrowFunctionExpression'
        );
        const isInsideClass = ancestors.some((ancestor: Rule.Node) =>
          ancestor.type === 'ClassDeclaration' ||
          ancestor.type === 'ClassExpression'
        );

        if (!isInsideFunction && !isInsideClass) {
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
