import { Rule, Scope } from 'eslint';
import { containsFlagIdentifier } from '../utils/conditional-flag-eval';

const EXPRESSION_WRAPPERS = new Set([
  'ParenthesizedExpression', 'TSAsExpression', 'TSTypeAssertion',
  'TSNonNullExpression', 'TSSatisfiesExpression', 'ChainExpression',
]);

// Match the wrappers handled by hosanna-transpiler's build-flag-runtime-lookup helper.
function unwrapExpression(node: Rule.Node): Rule.Node {
  let current = node as Rule.Node & { expression?: Rule.Node };
  while (EXPRESSION_WRAPPERS.has(current.type) && current.expression) {
    current = current.expression as Rule.Node & { expression?: Rule.Node };
  }
  return current;
}

function isPlainWrite(node: Rule.Node): boolean {
  let target = node;
  let parent = target.parent as Rule.Node & { expression?: Rule.Node };
  while (EXPRESSION_WRAPPERS.has(parent.type) && parent.expression === target) {
    target = parent;
    parent = target.parent as Rule.Node & { expression?: Rule.Node };
  }
  return parent.type === 'AssignmentExpression' && parent.operator === '=' && parent.left === target;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'HS-1142: Disallow runtime lookups of compiler-defined build flags.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      runtimeLookup:
        'HS-1142: "{{name}}" is a compile-time build directive. Reference it directly; do not use typeof or read it through globalThis/global or their aliases. Configure the owning build or test runtime when a flag is missing.',
    },
  },
  create(context) {
    function isGlobalObject(node: Rule.Node, visited = new Set<Scope.Variable>()): boolean {
      const current = unwrapExpression(node);
      if (current.type !== 'Identifier') return false;

      let scope: Scope.Scope | null = context.sourceCode.getScope(current);
      let variable: Scope.Variable | undefined;
      while (scope && !variable) {
        variable = scope.set.get(current.name);
        scope = scope.upper;
      }
      if (current.name === 'globalThis' || current.name === 'global') {
        return !variable || variable.defs.length === 0;
      }
      // The compiler follows stable bindings, including a let binding with no reassignment.
      if (!variable || visited.has(variable) || variable.references.some(reference => reference.isWrite() && !reference.init)) {
        return false;
      }
      const declaration = variable.defs.find(definition => definition.type === 'Variable')?.node;
      if (declaration?.type !== 'VariableDeclarator' || declaration.id.type !== 'Identifier'
        || declaration.id.name !== current.name || !declaration.init) return false;
      visited.add(variable);
      return isGlobalObject(declaration.init as Rule.Node, visited);
    }

    return {
      UnaryExpression(node) {
        if (node.operator !== 'typeof') return;
        const argument = unwrapExpression(node.argument as Rule.Node);
        if (argument.type !== 'Identifier' || !containsFlagIdentifier(argument)) return;
        context.report({ node, messageId: 'runtimeLookup', data: { name: argument.name } });
      },
      MemberExpression(node) {
        const property = node.computed ? unwrapExpression(node.property as Rule.Node) : node.property;
        const name = !node.computed && property.type === 'Identifier'
          ? property.name
          : node.computed && property.type === 'Literal' && typeof property.value === 'string'
            ? property.value
            : undefined;
        if (!name || !containsFlagIdentifier({ type: 'Identifier', name })) return;
        // Native __HS_*__ properties hold host hooks and runtime data, not build directives.
        if (name.startsWith('__HS_')) return;
        // Native hosts publish the injected constants before loading the application.
        // A plain write does not inspect whether the global flag exists.
        if (isPlainWrite(node)) return;
        if (!isGlobalObject(node.object as Rule.Node)) return;
        context.report({ node, messageId: 'runtimeLookup', data: { name } });
      },
    };
  },
};

export default rule;
