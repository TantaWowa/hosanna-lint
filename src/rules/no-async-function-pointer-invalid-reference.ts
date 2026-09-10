import { Rule, Scope } from 'eslint';
import { createTypedAsyncFunctionPointerListener } from '../utils/async-function-pointer';

type Node = {
  type: string;
  parent?: Node;
  name?: string;
  id?: Node;
  init?: Node;
  value?: Node;
  left?: Node;
  right?: Node;
  expression?: Node;
  typeAnnotation?: Node;
  typeName?: Node;
  returnType?: Node;
  types?: Node[];
  params?: Node[];
  arguments?: Node[];
  callee?: Node;
  body?: Node | Node[];
  declaration?: Node;
  specifiers?: { type: string; local?: Node }[];
  source?: unknown;
};

function findVariable(node: Node, context: Rule.RuleContext): Scope.Variable | undefined {
  let scope: Scope.Scope | undefined | null = context.sourceCode.getScope(node as Rule.Node);
  while (scope) {
    const variable = node.name ? scope.set.get(node.name) : undefined;
    if (variable) return variable;
    scope = scope.upper;
  }
  return undefined;
}

/** Direct-annotation checks remain available when the editor has no TypeScript project. */
function syntaxListener(context: Rule.RuleContext): Rule.RuleListener {
  const reported = new Set<Node>();
  function isPointerType(node: Node | undefined, seen = new Set<Node>()): boolean {
    if (!node || seen.has(node)) return false;
    seen.add(node);
    if (node.type === 'TSTypeAnnotation' || node.type === 'TSParenthesizedType') return isPointerType(node.typeAnnotation, seen);
    if (node.type === 'TSUnionType' || node.type === 'TSIntersectionType') return node.types?.some(type => isPointerType(type, new Set(seen))) ?? false;
    if (node.type !== 'TSTypeReference' || node.typeName?.type !== 'Identifier') return false;
    const variable = findVariable(node.typeName, context);
    if (!variable?.defs.length) return node.typeName.name === 'AsyncFunctionPointer';
    return variable.defs.some(definition => {
      const declaration = definition.node as Node;
      return declaration.type === 'TSTypeAliasDeclaration' && declaration.id?.name !== 'AsyncFunctionPointer' && isPointerType(declaration.typeAnnotation, seen);
    });
  }
  function hasPointerType(node: Node | undefined): boolean {
    if (!node) return false;
    return isPointerType((node.type === 'AssignmentPattern' ? node.left : node)?.typeAnnotation);
  }
  function exportedFunction(node: Node): boolean {
    const exportParent = node.parent;
    if (node.type !== 'FunctionDeclaration' || !node.id) return false;
    if ((exportParent?.type === 'ExportNamedDeclaration' || exportParent?.type === 'ExportDefaultDeclaration') && exportParent.parent?.type === 'Program') return true;
    if (node.parent?.type !== 'Program') return false;
    const body = (context.sourceCode.ast as Node).body;
    return Array.isArray(body) && body.some(statement => statement.type === 'ExportNamedDeclaration' && !statement.source &&
      statement.specifiers?.some(specifier => specifier.type === 'ExportSpecifier' && specifier.local?.name === node.id?.name));
  }
  function validValue(node: Node): boolean {
    if (['TSAsExpression', 'TSTypeAssertion', 'TSNonNullExpression', 'TSSatisfiesExpression'].includes(node.type) && node.expression) return validValue(node.expression);
    if (node.type !== 'Identifier') return false;
    if (node.name === 'undefined') return true;
    const variable = findVariable(node, context);
    return variable?.defs.some(definition => definition.type === 'ImportBinding' || exportedFunction(definition.node as Node) ||
      (definition.node.type === 'VariableDeclarator' && hasPointerType((definition.node as Node).id)) ||
      (definition.type === 'Parameter' && hasPointerType(definition.name as Node))) ?? false;
  }
  function check(value: Node | undefined, isPointer: boolean) {
    if (!value || !isPointer || reported.has(value) || validValue(value)) return;
    reported.add(value);
    context.report({ node: value as Rule.Node, messageId: 'invalidAsyncFunctionPointer' });
  }
  function checkParameters(node: Node) {
    for (const parameter of node.params ?? []) {
      if (parameter.type === 'AssignmentPattern') check(parameter.right, hasPointerType(parameter));
    }
  }
  return {
    VariableDeclarator(node) { const value = node as Node; check(value.init, hasPointerType(value.id)); },
    PropertyDefinition(node) { const value = node as Node; check(value.value, hasPointerType(value)); },
    AssignmentExpression(node) {
      const value = node as Node;
      const variable = value.left?.type === 'Identifier' ? findVariable(value.left, context) : undefined;
      check(value.right, variable?.defs.some(definition => hasPointerType((definition.node as Node).id)) ?? false);
    },
    FunctionDeclaration(node) { checkParameters(node as Node); },
    FunctionExpression(node) { checkParameters(node as Node); },
    ArrowFunctionExpression(node) {
      const arrow = node as unknown as Node;
      checkParameters(arrow);
      if (arrow.body && !Array.isArray(arrow.body) && arrow.body.type !== 'BlockStatement') check(arrow.body, isPointerType(arrow.returnType));
    },
    ReturnStatement(node) {
      const value = node as Node & { argument?: Node };
      let parent = value.parent;
      while (parent && !['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(parent.type)) parent = parent.parent;
      check(value.argument, isPointerType(parent?.returnType));
    },
    CallExpression(node) {
      const call = node as Node;
      const variable = call.callee?.type === 'Identifier' ? findVariable(call.callee, context) : undefined;
      const declaration = variable?.defs.find(definition => definition.node.type === 'FunctionDeclaration')?.node as Node | undefined;
      call.arguments?.forEach((argument, index) => check(argument, hasPointerType(declaration?.params?.[index])));
    },
  };
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require module-accessible exported named functions in AsyncFunctionPointer slots, including contextual properties, arguments, and returns.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      invalidAsyncFunctionPointer: 'AsyncFunctionPointer is serialized by module/function name on Roku. Use an exported, module-scope named function directly (export function handleResponse(response) { ... }), or forward an existing AsyncFunctionPointer value. Arrows, inline functions, methods, bind() results, and local callback aliases have no serializable module function identity. Pass caller state through options.contextData and read response.contextData instead of capturing this or local variables.',
    },
  },
  create(context) {
    return createTypedAsyncFunctionPointerListener(context) ?? syntaxListener(context);
  },
};

export default rule;
