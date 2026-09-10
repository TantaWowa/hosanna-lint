import { Rule } from 'eslint';
import * as ts from 'typescript';

export interface HosannaLifecycleServices {
  program?: ts.Program;
  esTreeNodeToTSNodeMap: Map<Rule.Node, ts.Node>;
  tsNodeToESTreeNodeMap: Map<ts.Node, Rule.Node>;
}

export function getLifecycleServices(context: Rule.RuleContext): HosannaLifecycleServices | undefined {
  const services = context.sourceCode.parserServices as Partial<HosannaLifecycleServices>;
  if (!services.esTreeNodeToTSNodeMap || !services.tsNodeToESTreeNodeMap) return undefined;
  return services as HosannaLifecycleServices;
}

export function isHosannaModule(fileName: string, modulePath: string): boolean {
  const normalized = fileName.replace(/\\/g, '/').replace(/(?:\.d)?\.[cm]?tsx?$/, '');
  return normalized.endsWith(`/${modulePath}`) || normalized === `@hs-src/${modulePath}`;
}

export function unwrapExpression(expression: ts.Expression): ts.Expression {
  let current = expression;
  while (ts.isParenthesizedExpression(current) || ts.isAsExpression(current) ||
      ts.isTypeAssertionExpression(current) || ts.isNonNullExpression(current) || ts.isSatisfiesExpression(current)) {
    current = current.expression;
  }
  return current;
}

function followAlias(symbol: ts.Symbol, checker: ts.TypeChecker): ts.Symbol {
  return symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
}

/** Match declaration ownership, never an application's coincidentally named method. */
export function isHosannaDeclaration(
  declaration: ts.Node | undefined,
  modulePath: string,
  owner: string,
  member?: string,
): boolean {
  if (!declaration || !isHosannaModule(declaration.getSourceFile().fileName, modulePath)) return false;
  if (!member) return ts.isFunctionDeclaration(declaration) && declaration.name?.text === owner;
  if (!ts.isMethodDeclaration(declaration) && !ts.isMethodSignature(declaration)) return false;
  const name = declaration.name;
  if ((!ts.isIdentifier(name) && !ts.isStringLiteral(name)) || name.text !== member) return false;
  const container = declaration.parent;
  return (ts.isClassDeclaration(container) || ts.isInterfaceDeclaration(container)) && container.name?.text === owner;
}

/** Type information resolves import aliases, namespace members and re-exports. */
export function isHosannaFunctionCall(
  call: ts.CallExpression,
  checker: ts.TypeChecker | undefined,
  modulePath: string,
  exportName: string,
): boolean {
  if (checker) {
    const declaration = checker.getResolvedSignature(call)?.getDeclaration();
    if (isHosannaDeclaration(declaration, modulePath, exportName)) return true;
    const symbol = checker.getSymbolAtLocation(unwrapExpression(call.expression));
    if (symbol && followAlias(symbol, checker).declarations?.some(item => isHosannaDeclaration(item, modulePath, exportName))) return true;
  }

  return false;
}
