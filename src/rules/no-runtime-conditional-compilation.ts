import { Rule, Scope } from 'eslint';

// Match the compiler's getFlagValueForName convention, including custom build flags.
function isBuildFlag(name: string): boolean {
  return name.length > 4 && name.startsWith('__') && name.endsWith('__');
}

type ExpressionNode = {
  type: string;
  parent?: ExpressionNode;
  name?: string;
  value?: unknown;
  operator?: string;
  argument?: ExpressionNode;
  expression?: ExpressionNode;
  left?: ExpressionNode;
  right?: ExpressionNode;
  test?: ExpressionNode;
  alternate?: ExpressionNode;
  object?: ExpressionNode;
  property?: ExpressionNode;
  computed?: boolean;
  id?: ExpressionNode;
  init?: ExpressionNode;
  key?: ExpressionNode;
  properties?: ExpressionNode[];
  declare?: boolean;
  importKind?: string;
  callee?: ExpressionNode;
  arguments?: ExpressionNode[];
};

/** Syntax accepted by ConditionalCompilation.ts, independent of configured flag values. */
function isCompileTimeExpression(node: ExpressionNode | undefined): boolean {
  if (!node) return false;
  if (node.type === 'Identifier') return isBuildFlag(node.name ?? '');
  if (node.type === 'Literal') return typeof node.value === 'boolean';
  if (node.type === 'ParenthesizedExpression') return isCompileTimeExpression(node.expression);
  if (node.type === 'UnaryExpression' && node.operator === '!') {
    return isCompileTimeExpression(node.argument);
  }
  if (node.type === 'LogicalExpression' && (node.operator === '&&' || node.operator === '||')) {
    return isCompileTimeExpression(node.left) && isCompileTimeExpression(node.right);
  }
  return false;
}

function isDirectCompileTimeTest(node: ExpressionNode): boolean {
  let expression = node;
  let parent = expression.parent as ExpressionNode | undefined;
  while (parent) {
    if (parent.type === 'IfStatement') {
      const isElseIf = parent.parent?.type === 'IfStatement' && parent.parent.alternate === parent;
      return !parent.alternate && !isElseIf && parent.test === expression && isCompileTimeExpression(expression);
    }
    if (
      (parent.type === 'UnaryExpression' && parent.operator === '!') ||
      (parent.type === 'LogicalExpression' && (parent.operator === '&&' || parent.operator === '||')) ||
      parent.type === 'ParenthesizedExpression'
    ) {
      expression = parent;
      parent = expression.parent as ExpressionNode | undefined;
      continue;
    }
    return false;
  }
  return false;
}

function getStaticPropertyName(property: ExpressionNode | undefined, computed: boolean | undefined): string | undefined {
  if (property?.type === 'Literal' && typeof property.value === 'string') return property.value;
  return !computed && property?.type === 'Identifier' ? property.name : undefined;
}

function getPropertyFlag(property: ExpressionNode | undefined, computed: boolean | undefined): string | undefined {
  const name = getStaticPropertyName(property, computed);
  // Global host hooks use __HS_*__ properties; they are runtime data, not compiler directives.
  return name && /^__[A-Z][A-Z0-9_]*__$/.test(name) && !name.startsWith('__HS_') ? name : undefined;
}

function findVariable(identifier: ExpressionNode, context: Rule.RuleContext): Scope.Variable | undefined {
  if (!identifier.name) return undefined;
  let scope: Scope.Scope | undefined | null = context.sourceCode.getScope(identifier as Rule.Node);
  while (scope) {
    const variable = scope.set.get(identifier.name);
    if (variable) return variable;
    scope = scope.upper;
  }
  return undefined;
}

function isGlobalObject(
  expression: ExpressionNode | undefined,
  context: Rule.RuleContext,
  visited = new Set<Scope.Variable>()
): boolean {
  let object = expression;
  while (object && ['TSAsExpression', 'TSTypeAssertion', 'TSNonNullExpression', 'ChainExpression'].includes(object.type)) {
    object = object.expression;
  }
  if (object?.type !== 'Identifier' || !object.name) return false;
  const variable = findVariable(object, context);
  if (!variable || variable.defs.length === 0) {
    return ['globalThis', 'global', 'window', 'self'].includes(object.name);
  }
  if (visited.has(variable)) return false;
  visited.add(variable);
  const definition = variable.defs.find(def => def.type === 'Variable' && def.parent?.kind === 'const');
  const declaration = definition?.node as ExpressionNode | undefined;
  return declaration?.type === 'VariableDeclarator' && declaration.id?.type === 'Identifier'
    ? isGlobalObject(declaration.init, context, visited)
    : false;
}

function isNonRuntimeDefinition(node: ExpressionNode): boolean {
  let current: ExpressionNode | undefined = node;
  while (current) {
    if (current.declare || current.importKind === 'type' || [
      'TSDeclareFunction', 'TSInterfaceDeclaration', 'TSTypeAliasDeclaration',
      'TSTypeAnnotation', 'TSFunctionType', 'TSConstructorType', 'TSMethodSignature',
      'TSCallSignatureDeclaration', 'TSConstructSignatureDeclaration', 'TSIndexSignature',
    ].includes(current.type)) return true;
    current = current.parent;
  }
  return false;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Keep build directives in direct, flag-only if tests so the compiler can prune platform branches.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      runtimeUse:
        'Compiler directive {{name}} may only appear in a standalone, flag-only if test. This runtime use prevents compile-time branch pruning. Put the platform-specific work inside if ({{name}}) { ... } or if (!{{name}}) { ... }; nest runtime conditions inside those blocks and use separate flag checks instead of else chains. Hosanna reserves the __NAME__ identifier namespace for compiler flags; give non-conditional injected values a different name without those delimiters.',
      definitionOrMutation:
        'Do not define or assign compiler directive {{name}} in application code. Set {{flag}} in hsconfig.json buildFlags, then use if ({{name}}) { ... } at the code to include. A runtime variable, parameter, assignment, or update cannot replace a compiler directive.',
    },
  },
  create(context) {
    if (/\.d\.[cm]?ts$/.test(context.filename)) return {};
    const reported = new Set<ExpressionNode>();
    function report(node: ExpressionNode, name: string, messageId = 'runtimeUse') {
      if (reported.has(node)) return;
      reported.add(node);
      context.report({ node: node as Rule.Node, messageId, data: { name, flag: name.slice(2, -2) } });
    }

    function checkDestructuring(pattern: ExpressionNode | undefined, source: ExpressionNode | undefined) {
      if (pattern?.type !== 'ObjectPattern' || !isGlobalObject(source, context)) return;
      for (const property of pattern.properties ?? []) {
        if (property.type !== 'Property') continue;
        const name = getPropertyFlag(property.key, property.computed);
        if (name) {
          report(property, name);
        }
      }
    }

    return {
      CallExpression(node) {
        const call = node as ExpressionNode;
        const callee = call.callee;
        const owner = callee?.object;
        if (callee?.type !== 'MemberExpression' || owner?.type !== 'Identifier' || owner.name !== 'Object') return;
        if ((findVariable(owner, context)?.defs.length ?? 0) > 0) return;
        const operation = getStaticPropertyName(callee.property, callee.computed);
        if (!isGlobalObject(call.arguments?.[0], context)) return;
        if (operation === 'defineProperty') {
          const key = call.arguments?.[1];
          const name = getPropertyFlag(key, true);
          if (key && name) report(key, name, 'definitionOrMutation');
        }
        if (operation === 'assign') {
          for (const source of call.arguments?.slice(1) ?? []) {
            if (source.type !== 'ObjectExpression') continue;
            for (const property of source.properties ?? []) {
              if (property.type !== 'Property') continue;
              const name = getPropertyFlag(property.key, property.computed);
              if (name) report(property, name, 'definitionOrMutation');
            }
          }
        }
      },
      VariableDeclarator(node) {
        const declaration = node as ExpressionNode;
        checkDestructuring(declaration.id, declaration.init);
      },
      AssignmentExpression(node) {
        const assignment = node as ExpressionNode;
        checkDestructuring(assignment.left, assignment.right);
      },
      MemberExpression(node) {
        const expression = node as ExpressionNode;
        const name = getPropertyFlag(expression.property, expression.computed);
        if (!name || !isGlobalObject(expression.object, context)) return;
        const parent = expression.parent;
        const isMutation = (parent?.type === 'AssignmentExpression' && parent.left === expression)
          || parent?.type === 'UpdateExpression'
          || ((parent?.type === 'ForOfStatement' || parent?.type === 'ForInStatement') && parent.left === expression);
        report(expression, name, isMutation ? 'definitionOrMutation' : 'runtimeUse');
      },
      'Program:exit'() {
        // Scope references cover reads and writes; variable definitions additionally cover
        // parameters and declarations without initializers. TypeScript-only bindings are omitted.
        for (const scope of context.sourceCode.scopeManager?.scopes ?? []) {
          for (const variable of scope.variables) {
            if (!isBuildFlag(variable.name)) continue;
            for (const definition of variable.defs) {
              const typedDefinition = definition as Scope.Definition & { isVariableDefinition?: boolean };
              if (typedDefinition.isVariableDefinition === false || String(definition.type) === 'TSEnumMember') continue;
              const identifier = definition.name as ExpressionNode;
              if (!isNonRuntimeDefinition(identifier)) report(identifier, variable.name, 'definitionOrMutation');
            }
          }
          for (const reference of scope.references) {
            const valueReference = reference as Scope.Reference & { isValueReference?: boolean };
            const identifier = reference.identifier;
            if (valueReference.isValueReference === false || !isBuildFlag(identifier.name) || isNonRuntimeDefinition(identifier as ExpressionNode)) {
              continue;
            }
            if (!isDirectCompileTimeTest(identifier as ExpressionNode)) {
              report(identifier as ExpressionNode, identifier.name, reference.isWrite() ? 'definitionOrMutation' : 'runtimeUse');
            }
          }
        }
      },
    };
  },
};

export default rule;
