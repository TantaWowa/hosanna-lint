import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require @hs-src/ prefix for hosanna package imports',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      requireHosannaSrcPrefix: 'Imports from hosanna packages must use the @hs-src/ prefix. Change "{{source}}" to start with "@hs-src/".',
    },
  },
      create: function (context) {
        return {
          ImportDeclaration: function (node) {
            const source = node.source.value;
            if (typeof source !== 'string') {
              return;
            }

            // Check if import is from hosanna packages
            const hosannaPackages = /(?:^|\/)(hosanna-ui|hosanna-bridge|hosanna-bridge-lib|hosanna-bridge-targets|hosanna-list|hosanna-bridge-http)(?:\/|$)/;
            if (hosannaPackages.test(source)) {
              // If it's a hosanna package but doesn't have @hs-src/ before the package, report error
              if (!source.includes('@hs-src/')) {
                context.report({
                  node: node.source,
                  messageId: 'requireHosannaSrcPrefix',
                  data: {
                    source: source,
                  },
                  fix: (fixer) => {
                    // Simple fix: replace the first hosanna package found with @hs-src/ prefix
                    // Only apply if the source doesn't already start with @hs-src/
                    if (source.startsWith('@hs-src/')) {
                      return null; // Already fixed
                    }

                    const hosannaPackagesList = ['hosanna-ui', 'hosanna-bridge', 'hosanna-bridge-lib', 'hosanna-bridge-targets', 'hosanna-list', 'hosanna-bridge-http'];

                    for (const packageName of hosannaPackagesList) {
                      // Find the first occurrence of /packageName or ^packageName
                      const index = source.indexOf(packageName);
                      if (index !== -1) {
                        // Check if it's not already prefixed with @hs-src/
                        const beforePackage = source.substring(0, index);
                        if (!beforePackage.includes('@hs-src/')) {
                          // Replace the package name with @hs-src/packageName
                          const before = source.substring(0, index);
                          const after = source.substring(index + packageName.length);
                          const fixedSource = `${before}@hs-src/${packageName}${after}`;
                          return fixer.replaceText(node.source, `'${fixedSource}'`);
                        }
                      }
                    }

                    // Fallback: prepend @hs-src/ only if not already present
                    if (!source.includes('@hs-src/')) {
                      return fixer.replaceText(node.source, `'@hs-src/${source}'`);
                    }
                    return null;
                  },
                });
              }
            }
          },
        };
      },
};

export default rule;
