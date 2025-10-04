import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow JSON imports as Hosanna does not support importing JSON files',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      jsonImportNotSupported: 'JSON imports are not supported in Hosanna. Use JSON.parse(ReadAsciiFile(\'pkg:/assets/{{filename}}\')) instead.',
    },
  },
  create: function (context) {
    return {
      ImportDeclaration: function (node) {
        const source = node.source.value;
        if (typeof source !== 'string') {
          return;
        }

        // Check if the import ends with .json
        if (source.endsWith('.json')) {
          // Extract filename from path
          const filename = source.split('/').pop() || 'file.json';

          context.report({
            node: node.source,
            messageId: 'jsonImportNotSupported',
            data: {
              filename: filename,
            },
            fix: (fixer) => {
              // Suggest replacement with JSON.parse(ReadAsciiFile(...)) pattern
              // We can't provide a complete fix since we don't know the exact path,
              // but we can provide a template
              const suggestion = `JSON.parse(ReadAsciiFile('pkg:/assets/${filename}'))`;
              return fixer.replaceText(node, `const ${node.specifiers[0]?.local?.name || 'data'} = ${suggestion};`);
            },
          });
        }
      },
    };
  },
};

export default rule;
