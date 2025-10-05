import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Restrict computed property keys in object literals to enums and literals only',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      computedPropertyInObjectLiteral: 'Computed property keys in object literals are only supported for enums and literals. Code like: `const b = MyEnum.Value; const a = { [b]: \'c\' }` should be refactored to `const a = {} a[b] = \'c\'`. Code like `const a = { [MyEnum.Value]: \'c\' }` is supported',
    },
  },
  create: function (context) {
    return {
      Property: function (node) {
        // Check if this is a computed property in an object literal
        if (node.computed && node.parent.type === 'ObjectExpression') {
          // Check if the computed key is NOT an enum reference or literal
          const keyExpr = node.key;

          // Allow literals (strings, numbers)
          if (keyExpr.type === 'Literal') {
            return;
          }

          // Allow member expressions that look like enum references (e.g., MyEnum.Value)
          if (keyExpr.type === 'MemberExpression' &&
              keyExpr.object.type === 'Identifier' &&
              keyExpr.property.type === 'Identifier') {
            // This could be an enum reference like MyEnum.Value - allow it
            return;
          }

          // For anything else (variables, complex expressions), flag it
          context.report({
            node: node.key,
            messageId: 'computedPropertyInObjectLiteral',
          });
        }
      },
    };
  },
};

export default rule;
