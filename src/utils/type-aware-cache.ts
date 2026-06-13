import { Rule } from 'eslint';
import * as ts from 'typescript';
import { isBrsNodeType } from './is-brs-node-type';

export interface TypeAwareParserServices {
  program: ts.Program;
  getTypeAtLocation: (node: Rule.Node) => ts.Type;
}

export interface CachedBinaryExpressionTypes {
  checker: ts.TypeChecker;
  leftType: ts.Type;
  rightType: ts.Type;
}

type SourceCodeLike = Rule.RuleContext['sourceCode'];
type BinaryExpressionLike = Rule.Node & { left: Rule.Node; right: Rule.Node };

const checkerCache = new WeakMap<ts.Program, ts.TypeChecker>();
const typeAtLocationCache = new WeakMap<object, WeakMap<Rule.Node, ts.Type>>();
const binaryExpressionTypeCache = new WeakMap<object, WeakMap<Rule.Node, CachedBinaryExpressionTypes>>();
const brsNodeTypeCache = new WeakMap<ts.Type, boolean>();

export function getTypeAwareParserServices(context: Rule.RuleContext): TypeAwareParserServices | undefined {
  const parserServices = context.sourceCode?.parserServices as Partial<TypeAwareParserServices> | undefined;
  if (parserServices?.program && typeof parserServices.getTypeAtLocation === 'function') {
    return parserServices as TypeAwareParserServices;
  }
  return undefined;
}

export function getCachedTypeChecker(program: ts.Program): ts.TypeChecker {
  let checker = checkerCache.get(program);
  if (!checker) {
    checker = program.getTypeChecker();
    checkerCache.set(program, checker);
  }
  return checker;
}

export function getCachedTypeAtLocation(
  sourceCode: SourceCodeLike,
  parserServices: TypeAwareParserServices,
  node: Rule.Node
): ts.Type {
  let sourceCache = typeAtLocationCache.get(sourceCode);
  if (!sourceCache) {
    sourceCache = new WeakMap();
    typeAtLocationCache.set(sourceCode, sourceCache);
  }

  let type = sourceCache.get(node);
  if (!type) {
    type = parserServices.getTypeAtLocation(node);
    sourceCache.set(node, type);
  }
  return type;
}

export function getCachedBinaryExpressionTypes(
  sourceCode: SourceCodeLike,
  parserServices: TypeAwareParserServices,
  node: BinaryExpressionLike
): CachedBinaryExpressionTypes {
  let sourceCache = binaryExpressionTypeCache.get(sourceCode);
  if (!sourceCache) {
    sourceCache = new WeakMap();
    binaryExpressionTypeCache.set(sourceCode, sourceCache);
  }

  let cached = sourceCache.get(node);
  if (!cached) {
    cached = {
      checker: getCachedTypeChecker(parserServices.program),
      leftType: getCachedTypeAtLocation(sourceCode, parserServices, node.left),
      rightType: getCachedTypeAtLocation(sourceCode, parserServices, node.right),
    };
    sourceCache.set(node, cached);
  }
  return cached;
}

export function isCachedBrsNodeType(type: ts.Type): boolean {
  const cached = brsNodeTypeCache.get(type);
  if (cached !== undefined) {
    return cached;
  }

  const result = isBrsNodeType(type);
  brsNodeTypeCache.set(type, result);
  return result;
}
