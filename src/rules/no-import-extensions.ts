import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow .js and .ts extensions in import paths',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      importPathExtensionNotAllowed: 'Import paths should not end with \'.js\' or \'.ts\'. Remove the extension from \'{{path}}\'.',
    },
  },
  create: function (context) {
    return {
      ImportDeclaration: function (node) {
        const moduleSpecifier = node.source;

        if (moduleSpecifier.type === 'Literal' && typeof moduleSpecifier.value === 'string') {
          const importPath = moduleSpecifier.value;

          if (importPath.endsWith('.js') || importPath.endsWith('.ts')) {
            context.report({
              node: moduleSpecifier,
              messageId: 'importPathExtensionNotAllowed',
              data: {
                path: importPath,
              },
              fix: (fixer) => {
                // Remove the .js or .ts extension
                const newPath = importPath.replace(/(\.js|\.ts)$/, '');
                return fixer.replaceText(moduleSpecifier, `'${newPath}'`);
              },
            });
          }
        }
      },
    };
  },
};

export default rule;
