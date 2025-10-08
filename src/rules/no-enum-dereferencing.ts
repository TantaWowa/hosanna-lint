import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow enum dereferencing/lookup operations that are not supported in Hosanna',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      enumDereferencingNotSupported: 'Enum dereferencing "{{enumName}}[{{property}}]" is not supported in Hosanna. Enums must be accessed directly as compile-time constants.',
      objectKeysOnEnum: 'Object.keys() on enum "{{enumName}}" is not supported in Hosanna.',
      objectValuesOnEnum: 'Object.values() on enum "{{enumName}}" is not supported in Hosanna.',
      objectEntriesOnEnum: 'Object.entries() on enum "{{enumName}}" is not supported in Hosanna.',
      forInOnEnum: 'for...in iteration over enum "{{enumName}}" is not supported in Hosanna.',
    },
  },
  create: function (context) {
    // Track enum declarations in the current scope
    const enumDeclarations = new Set<string>();

    return {
      TSEnumDeclaration: function (node) {
        // Record enum names as we encounter them
        enumDeclarations.add(node.id.name);
      },

      // Detect enum[property] access patterns
      MemberExpression: function (node) {
        if (node.computed &&
            node.object.type === 'Identifier' &&
            enumDeclarations.has(node.object.name)) {
          context.report({
            node,
            messageId: 'enumDereferencingNotSupported',
            data: {
              enumName: node.object.name,
              property: context.sourceCode.getText(node.property)
            },
          });
        }
      },

      // Detect Object.keys(enum)
      CallExpression: function (node) {
        if (node.callee.type === 'MemberExpression' &&
            node.callee.object.type === 'Identifier' &&
            node.callee.object.name === 'Object' &&
            node.callee.property.type === 'Identifier') {

          const methodName = node.callee.property.name;
          if ((methodName === 'keys' || methodName === 'values' || methodName === 'entries') &&
              node.arguments.length === 1 &&
              node.arguments[0].type === 'Identifier' &&
              enumDeclarations.has(node.arguments[0].name)) {

            const messageId = methodName === 'keys' ? 'objectKeysOnEnum' :
                             methodName === 'values' ? 'objectValuesOnEnum' :
                             'objectEntriesOnEnum';

            context.report({
              node,
              messageId,
              data: { enumName: node.arguments[0].name },
            });
          }
        }
      },

      // Detect for...in loops on enums
      ForInStatement: function (node) {
        if (node.right.type === 'Identifier' &&
            enumDeclarations.has(node.right.name)) {
          context.report({
            node: node.right,
            messageId: 'forInOnEnum',
            data: { enumName: node.right.name },
          });
        }
      },
    };
  },
};

export default rule;
