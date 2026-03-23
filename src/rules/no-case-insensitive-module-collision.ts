import { Rule } from 'eslint';

/**
 * Mirrors transpiler module item registration (imports + module-scoped declarations):
 * names must be unique ignoring ASCII case (BrightScript / Hosanna module items).
 */
const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'HS-1021: Module-scoped bindings (imports, top-level declarations) must be case-insensitively unique.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      caseInsensitiveModuleCollision:
        'HS-1021: Case-insensitive module item collision: "{{name}}" conflicts with "{{existing}}". Module-level declarations must be case-insensitively unique.',
    },
  },
  create(context) {
    return {
      'Program:exit'(node) {
        const sm = context.sourceCode.scopeManager;
        if (!sm) return;

        let moduleScope = sm.scopes.find((s) => s.type === 'module');
        if (!moduleScope) {
          moduleScope = sm.scopes.find((s) => s.block === node);
        }
        if (!moduleScope) return;

        const seen = new Map<string, string>();
        for (const variable of moduleScope.variables) {
          if (variable.name.startsWith('__')) continue;
          const lower = variable.name.toLowerCase();
          const existing = seen.get(lower);
          if (existing && existing !== variable.name) {
            const def = variable.defs[0];
            const reportNode = def?.name ?? def?.node ?? variable.identifiers[0];
            if (reportNode) {
              context.report({
                node: reportNode as Rule.Node,
                messageId: 'caseInsensitiveModuleCollision',
                data: { name: variable.name, existing },
              });
            }
          } else if (!existing) {
            seen.set(lower, variable.name);
          }
        }
      },
    };
  },
};

export default rule;
