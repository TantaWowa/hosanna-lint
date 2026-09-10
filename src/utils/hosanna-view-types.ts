import { Rule } from 'eslint';
import * as ts from 'typescript';

const FRAMEWORK_TYPES: Record<string, string> = {
  BaseView: '/hosanna-ui/views/lib/BaseView.ts',
  IHosannaView: '/hosanna-ui/views/lib/view-api.ts',
  ViewStruct: '/hosanna-ui/views/lib/view-api.ts',
  BaseApp: '/hosanna-ui/lib/BaseApp.ts',
  IInstancePool: '/hosanna-ui/hosanna-api.ts',
  CollectionViewSupplementaryView: '/hosanna-list/CollectionViewSupplementaryView.ts',
  view: '/hosanna-ui/lib/decorators.ts',
};

export function isHosannaSymbol(checker: ts.TypeChecker, symbol: ts.Symbol | undefined, name: string): boolean {
  if (!symbol) return false;
  if (symbol.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
  const suffix = FRAMEWORK_TYPES[name];
  return Boolean(suffix && symbol.name === name && symbol.declarations?.some(declaration => {
    const filename = declaration.getSourceFile().fileName.replace(/\\/g, '/').replace(/\.d\.ts$/, '.ts');
    return filename.endsWith(suffix);
  }));
}

export function isHosannaType(checker: ts.TypeChecker, type: ts.Type, names: string[], seen = new Set<ts.Type>()): boolean {
  if (seen.has(type)) return false;
  seen.add(type);
  if (names.some(name => isHosannaSymbol(checker, type.getSymbol(), name))) return true;
  if (type.isUnionOrIntersection() && type.types.some(part => isHosannaType(checker, part, names, seen))) return true;
  // Instantiated generic classes can be TypeReference objects without the
  // Class/Interface bits used by isClassOrInterface(). Follow their declaration
  // target so generated ButtonViewStruct<State> retains its ViewStruct ancestry.
  if ((type.flags & ts.TypeFlags.Object) && ((type as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference)) {
    const target = (type as ts.TypeReference).target;
    if (target !== type && isHosannaType(checker, target, names, seen)) return true;
  }
  if (type.isClassOrInterface()) {
    return checker.getBaseTypes(type).some(base => isHosannaType(checker, base, names, seen));
  }
  const constraint = checker.getBaseConstraintOfType(type);
  return Boolean(constraint && constraint !== type && isHosannaType(checker, constraint, names, seen));
}

export function isHosannaViewType(checker: ts.TypeChecker, type: ts.Type): boolean {
  return isHosannaType(checker, type, ['BaseView', 'IHosannaView']);
}

export function unwrapHosannaExpression(node: ts.Node): ts.Node {
  while (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node) || ts.isNonNullExpression(node)
    || ts.isParenthesizedExpression(node) || ts.isSatisfiesExpression(node)) {
    node = node.expression;
  }
  return node;
}

export function getHosannaTypeServices(context: Rule.RuleContext) {
  const services = context.sourceCode.parserServices as {
    program?: ts.Program;
    esTreeNodeToTSNodeMap?: Map<Rule.Node, ts.Node>;
  };
  if (!services?.program || !services.esTreeNodeToTSNodeMap) return undefined;
  const checker = services.program.getTypeChecker();
  const nodeAt = (node: Rule.Node) => services.esTreeNodeToTSNodeMap!.get(node)!;
  return {
    checker,
    nodeAt,
    typeAt: (node: Rule.Node) => checker.getTypeAtLocation(unwrapHosannaExpression(nodeAt(node))),
  };
}
