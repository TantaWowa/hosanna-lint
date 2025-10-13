import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce that AsyncManagerCommands can only be imported from @hs-generated-async/AsyncManagerCommands',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      asyncManagerCommandsWrongImport: 'AsyncManagerCommands must be imported from \'@hs-generated-async/AsyncManagerCommands\', not from \'{{source}}\'.',
    },
  },
  create: function (context) {
    return {
      ImportDeclaration: function (node) {
        const source = node.source.value;

        if (typeof source === 'string' && source.includes('AsyncManagerCommands')) {
          // Allow only the specific generated package
          if (source !== '@hs-generated-async/AsyncManagerCommands') {
            context.report({
              node: node.source,
              messageId: 'asyncManagerCommandsWrongImport',
              data: {
                source: source,
              },
              fix: (fixer) => {
                return fixer.replaceText(node.source, '\'@hs-generated-async/AsyncManagerCommands\'');
              },
            });
          }
        }
      },
    };
  },
};

export default rule;
