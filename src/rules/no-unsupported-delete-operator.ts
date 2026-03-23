import { Rule } from 'eslint';

/**
 * HS-1016: delete only supports MemberExpression targets (UnaryExpression-utils).
 * HS-1001: non-computed member delete requires an Identifier property name in the transpiler.
 */
const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'HS-1016 / HS-1001: delete operator argument must be a member expression; dot-form delete requires a simple identifier property.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      unsupportedDelete:
        'HS-1016: UnsupportedUseOfDeleteOperator: Unexpected argument type for delete operator.',
      unexpectedDeleteProperty:
        'HS-1001: UnexpectedDeleteOperatorArgs: delete operator cannot be used with this property shape; use bracket notation or an identifier property.',
    },
  },
  create(context) {
    return {
      UnaryExpression(node) {
        if (node.operator !== 'delete') return;
        if (node.argument.type !== 'MemberExpression') {
          context.report({
            node,
            messageId: 'unsupportedDelete',
          });
          return;
        }
        const m = node.argument;
        if (!m.computed && m.property.type !== 'Identifier') {
          context.report({
            node: m.property as Rule.Node,
            messageId: 'unexpectedDeleteProperty',
          });
        }
      },
    };
  },
};

export default rule;
