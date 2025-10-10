import { Rule } from 'eslint';

/**
 * Check if a node represents a literal that cannot be meaningfully used with unary operators
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isIllegalUnaryOperand(node: any): boolean {
  if (!node) return false;

  // String literals
  if (node.type === 'Literal' && typeof node.value === 'string') {
    return true;
  }

  // Boolean literals
  if (node.type === 'Literal' && typeof node.value === 'boolean') {
    return true;
  }

  // Object literals
  if (node.type === 'ObjectExpression') {
    return true;
  }

  // Array literals
  if (node.type === 'ArrayExpression') {
    return true;
  }

  // Null literal
  if (node.type === 'Literal' && node.value === null) {
    return true;
  }

  return false;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow unary operators on illegal or vague types',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      unaryOnIllegalType: 'Unary operator "{{operator}}" cannot be used on {{type}} as it may result in unexpected behavior or is not supported in Hosanna.',
    },
  },
  create: function (context) {
    return {
      UnaryExpression: function (node) {
        const operator = node.operator;

        // Only check for +, -, ~ operators (the ones that do type conversion)
        if (operator === '+' || operator === '-' || operator === '~') {
          if (isIllegalUnaryOperand(node.argument)) {
            let typeDescription = 'this type';
            if (node.argument.type === 'Literal') {
              if (typeof node.argument.value === 'string') {
                typeDescription = 'string literals';
              } else if (typeof node.argument.value === 'boolean') {
                typeDescription = 'boolean literals';
              } else if (node.argument.value === null) {
                typeDescription = 'null';
              }
            } else if (node.argument.type === 'ObjectExpression') {
              typeDescription = 'object literals';
            } else if (node.argument.type === 'ArrayExpression') {
              typeDescription = 'array literals';
            }

            context.report({
              node,
              messageId: 'unaryOnIllegalType',
              data: {
                operator,
                type: typeDescription,
              },
            });
          }
        }
      },
    };
  },
};

export default rule;
