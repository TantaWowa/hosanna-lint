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
    return {
      FunctionDeclaration: function (node) {
        // Check if we're inside another function-like construct
        let current = node.parent;
        const ancestors = [];
        while (current) {
          ancestors.push(current);
          current = current.parent;
        }

        const functionLikeAncestors = ancestors.filter((ancestor: any) =>
          ancestor.type === 'FunctionDeclaration' ||
          ancestor.type === 'FunctionExpression' ||
          ancestor.type === 'ArrowFunctionExpression'
        );

        if (functionLikeAncestors.length > 0) {
          context.report({
            node,
            messageId: 'nestedFunctionNotSupported',
          });
        }
      },

      FunctionExpression: function (node) {
        // Skip function expressions that are method bodies (they have MethodDefinition as parent)
        if (node.parent && (node.parent as any).type === 'MethodDefinition') {
          return;
        }

        // Check if we're inside another function-like construct
        let current = node.parent;
        const ancestors = [];
        while (current) {
          ancestors.push(current);
          current = current.parent;
        }

        const functionLikeAncestors = ancestors.filter((ancestor: any) =>
          ancestor.type === 'FunctionDeclaration' ||
          ancestor.type === 'FunctionExpression' ||
          ancestor.type === 'ArrowFunctionExpression'
        );

        if (functionLikeAncestors.length > 0) {
          context.report({
            node,
            messageId: 'nestedFunctionNotSupported',
          });
        }
      },
    };
  },
};

export default rule;
