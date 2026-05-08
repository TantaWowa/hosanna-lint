import { Rule } from 'eslint';

const ROKU_GLOBAL_FUNCTIONS = new Set([
  'CreateObject',
  'GetGlobalAA',
  'SetGlobalAA',
  'GetInterface',
  'GetPlatform',
  'WriteAsciiFile',
  'ReadAsciiFile',
  'CopyFile',
  'DeleteFile',
  'MatchFiles',
  'ListDir',
  'Sleep',
  'RebootSystem',
  'RunGarbageCollector',
  'GetLastRunCompileError',
  'GetLastRunRuntimeError',
]);

const WRAPPER_NODE_TYPES = new Set(['TSAsExpression', 'TSTypeAssertion', 'TSNonNullExpression', 'ChainExpression']);

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'HS-1124: Disallow typeof guards on Roku global functions. These globals are always available on Roku and typeof guards can transpile incorrectly.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      typeofRokuGlobal:
        'HS-1124: Do not guard Roku global function "{{name}}" with typeof. Call the global directly or isolate non-Roku behavior behind platform-specific code.',
    },
  },
  create(context) {
    function unwrapExpression(node: Rule.Node): Rule.Node {
      let current = node as Rule.Node & { expression?: Rule.Node; type: string };
      while (WRAPPER_NODE_TYPES.has(current.type) && current.expression) {
        current = current.expression as Rule.Node & { expression?: Rule.Node; type: string };
      }
      return current;
    }

    function getStringPropertyName(property: Rule.Node): string | undefined {
      if (property.type === 'Identifier') return property.name;
      if (property.type === 'Literal' && typeof property.value === 'string') return property.value;
      return undefined;
    }

    function isGlobalObject(node: Rule.Node): boolean {
      const current = unwrapExpression(node);
      return current.type === 'Identifier' && (current.name === 'globalThis' || current.name === 'global');
    }

    function getRokuGlobalName(node: Rule.Node): string | undefined {
      const current = unwrapExpression(node);
      if (current.type === 'Identifier' && ROKU_GLOBAL_FUNCTIONS.has(current.name)) {
        return current.name;
      }

      if (current.type === 'MemberExpression' && isGlobalObject(current.object as Rule.Node)) {
        const propertyName = getStringPropertyName(current.property as Rule.Node);
        if (propertyName && ROKU_GLOBAL_FUNCTIONS.has(propertyName)) {
          return propertyName;
        }
      }

      return undefined;
    }

    return {
      UnaryExpression(node) {
        if (node.operator !== 'typeof') return;

        const name = getRokuGlobalName(node.argument as Rule.Node);
        if (!name) return;

        context.report({
          node,
          messageId: 'typeofRokuGlobal',
          data: { name },
        });
      },
    };
  },
};

export default rule;
