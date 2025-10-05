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
    return {
      ClassDeclaration: function (node) {
        // Check if we're inside a function or method
        let current = node.parent;
        const ancestors = [];
        while (current) {
          ancestors.push(current);
          current = current.parent;
        }

        const isInsideFunction = ancestors.some((ancestor: any) =>
          ancestor.type === 'FunctionDeclaration' ||
          ancestor.type === 'FunctionExpression' ||
          ancestor.type === 'ArrowFunctionExpression'
        );
        const isInsideMethod = ancestors.some((ancestor: any) =>
          ancestor.type === 'MethodDefinition'
        );

        if (isInsideFunction || isInsideMethod) {
          context.report({
            node,
            messageId: 'inlineClassNotAllowed',
          });
        }
      },

      ClassExpression: function (node) {
        // Class expressions are also not allowed in functions/methods
        let current = node.parent;
        const ancestors = [];
        while (current) {
          ancestors.push(current);
          current = current.parent;
        }

        const isInsideFunction = ancestors.some((ancestor: any) =>
          ancestor.type === 'FunctionDeclaration' ||
          ancestor.type === 'FunctionExpression' ||
          ancestor.type === 'ArrowFunctionExpression'
        );
        const isInsideMethod = ancestors.some((ancestor: any) =>
          ancestor.type === 'MethodDefinition'
        );

        if (isInsideFunction || isInsideMethod) {
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
