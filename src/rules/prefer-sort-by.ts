import { Rule, Scope } from 'eslint';
import * as ts from 'typescript';
import {
  getCachedTypeAtLocation,
  getCachedTypeChecker,
  getTypeAwareParserServices,
} from '../utils/type-aware-cache';

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Warn that Array.sort() comparator callbacks are slow on Roku and recommend native Array.SortBy() for simple field sorts.',
      category: 'Performance',
      recommended: true,
    },
    schema: [],
    messages: {
      preferSortBy:
        'Array.sort() comparator callbacks are slow for large arrays on Roku. For a stable in-place sort by one string or number field, prefer SortBy(fieldName, flags). Keep sort() for computed or multi-field ordering.',
    },
  },
  create(context) {
    const services = getTypeAwareParserServices(context);
    const checker = services ? getCachedTypeChecker(services.program) : undefined;

    return {
      CallExpression(node) {
        if (node.callee.type !== 'MemberExpression') {
          return;
        }
        const property = node.callee.property;
        const methodName = !node.callee.computed && property.type === 'Identifier'
          ? property.name
          : node.callee.computed && property.type === 'Literal' && typeof property.value === 'string'
            ? property.value
            : undefined;
        if (
          methodName !== 'sort' ||
          node.callee.object.type === 'Super' ||
          !isArray(node.callee.object as Rule.Node, context, services, checker)
        ) {
          return;
        }
        context.report({
          node: property,
          messageId: 'preferSortBy',
        });
      },
    };
  },
};

function isArray(
  node: Rule.Node,
  context: Rule.RuleContext,
  services: ReturnType<typeof getTypeAwareParserServices>,
  checker: ts.TypeChecker | undefined
): boolean {
  if (services && checker) {
    const type = getCachedTypeAtLocation(context.sourceCode, services, node);
    return isArrayType(type, checker);
  }
  return isSyntacticallyArray(node, context);
}

function isArrayType(type: ts.Type, checker: ts.TypeChecker): boolean {
  if (checker.isArrayType(type) || checker.isTupleType(type)) {
    return true;
  }
  return type.isUnion() && type.types.every((member) => checker.isArrayType(member) || checker.isTupleType(member));
}

function isSyntacticallyArray(node: Rule.Node, context: Rule.RuleContext): boolean {
  if (node.type === 'ArrayExpression') {
    return true;
  }
  if (node.type !== 'Identifier') {
    return false;
  }
  const variable = context.sourceCode.getScope(node).variables.find((candidate: Scope.Variable) => candidate.name === node.name);
  const definition = variable?.defs[0];
  if (!definition || definition.node.type !== 'VariableDeclarator') {
    return false;
  }
  if (definition.node.init?.type === 'ArrayExpression') {
    return true;
  }
  const annotation = definition.node.id.type === 'Identifier' ? definition.node.id.typeAnnotation : undefined;
  if (!annotation || annotation.type !== 'TSTypeAnnotation') {
    return false;
  }
  const type = annotation.typeAnnotation;
  return type.type === 'TSArrayType' || (
    type.type === 'TSTypeReference' &&
    type.typeName.type === 'Identifier' &&
    type.typeName.name === 'Array'
  );
}

export default rule;
