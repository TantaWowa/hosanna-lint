import { Rule } from 'eslint';

const classRegistry = new Map<string, { filename: string }>();

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'HS-1063: Warn about duplicate class names. Class names must be unique across the whole Hosanna project.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      duplicateClassName:
        'HS-1063: Duplicate class name "{{className}}" found. Class names must be unique across the whole project. The class was already defined in "{{filename}}". Please rename one of these classes.',
    },
  },
  create: function (context) {
    const filename = context.filename || context.getFilename();

    return {
      ClassDeclaration: function (node) {
        if (!node.id) return;
        const className = node.id.name;

        const existing = classRegistry.get(className);
        if (existing && existing.filename !== filename) {
          context.report({
            node: node.id,
            messageId: 'duplicateClassName',
            data: { className, filename: existing.filename },
          });
        } else {
          classRegistry.set(className, { filename });
        }
      },
    };
  },
};

export default rule;
