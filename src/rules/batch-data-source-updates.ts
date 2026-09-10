import { Rule } from 'eslint';
import * as ts from 'typescript';
import { getLifecycleServices, isHosannaDeclaration, unwrapExpression } from '../utils/hosanna-lifecycle-api';

// Index and default of the actual applyNow parameter, not the final arbitrary boolean argument.
const mutations: Record<string, { index: number; defaultValue?: boolean }> = {
  appendRows: { index: 2 }, appendItemsToRow: { index: 2 }, insertItemsToRow: { index: 3 },
  addLoadedItemsToRow: { index: 2 }, removeItemsFromRow: { index: 3 }, updateItem: { index: 3 },
  removeRow: { index: 1 }, moveRowToIndex: { index: 2 }, markRowAsInvalid: { index: 1 },
  ChangeRowHidden: { index: 2 }, changeRowEnabled: { index: 2 }, UpdateRowConfiguration: { index: 2, defaultValue: true },
};
const syncArrayMethods = new Set(['forEach', 'map', 'filter', 'some', 'every', 'find', 'findIndex', 'reduce', 'reduceRight']);

function member(expression: ts.Expression) {
  const node = unwrapExpression(expression);
  if (ts.isPropertyAccessExpression(node)) return { owner: node.expression, name: node.name.text };
  if (ts.isElementAccessExpression(node) && ts.isStringLiteralLike(node.argumentExpression)) return { owner: node.expression, name: node.argumentExpression.text };
  return undefined;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: { description: 'Warn when a synchronous loop flushes the same Hosanna collection data source for each mutation.', recommended: true },
    schema: [],
    messages: {
      perIteration: 'PERF-002: {{operation}} flushes {{source}} inside each iteration of this synchronous loop. CollectionViewDataSource.applyUpdates() immediately notifies listeners, so related item changes can trigger repeated rendering and layout work. Queue the mutations with applyNow false, then call {{source}}.applyUpdates() once after the loop. Keep intermediate delivery only when listeners require it; this warning does not prove that moving notifications preserves behavior.',
    },
  },
  create(context) {
    const services = getLifecycleServices(context);
    const checker = services?.program?.getTypeChecker();
    if (!services || !checker) return {};
    const seen = new Set<ts.Node>();
    const ids = new Map<ts.Symbol, number>();
    const symbolId = (symbol: ts.Symbol) => {
      if (!ids.has(symbol)) ids.set(symbol, ids.size);
      return String(ids.get(symbol));
    };
    function operation(call: ts.CallExpression) {
      const access = member(call.expression);
      if (!access || !isHosannaDeclaration(checker!.getResolvedSignature(call)?.getDeclaration(), 'hosanna-list/CollectionViewDataSource', 'CollectionViewDataSource', access.name)) return undefined;
      return access.name === 'applyUpdates' || mutations[access.name] ? access : undefined;
    }
    function isArrayIteration(call: ts.CallExpression): boolean {
      const access = member(call.expression);
      const declaration = checker!.getResolvedSignature(call)?.getDeclaration();
      const source = declaration?.getSourceFile().fileName.replace(/\\/g, '/');
      const owner = declaration?.parent;
      return !!access && syncArrayMethods.has(access.name) && !!source && /\/lib\.[^/]+\.d\.ts$/.test(source)
        && !!owner && ts.isInterfaceDeclaration(owner) && ['Array', 'ReadonlyArray'].includes(owner.name.text);
    }
    function inspect(region: ts.Node, body: ts.Node) {
      const writes = new Set<ts.Symbol>();
      let asynchronous = false;
      const writeTarget = (expression: ts.Expression) => {
        const target = unwrapExpression(expression);
        if (ts.isArrayLiteralExpression(target)) {
          for (const item of target.elements) if (!ts.isOmittedExpression(item)) writeTarget(ts.isSpreadElement(item) ? item.expression : item);
          return;
        }
        if (ts.isObjectLiteralExpression(target)) {
          for (const item of target.properties) {
            if (ts.isPropertyAssignment(item)) writeTarget(item.initializer);
            if (ts.isShorthandPropertyAssignment(item)) {
              const symbol = checker!.getShorthandAssignmentValueSymbol(item);
              if (symbol) writes.add(symbol);
            }
            if (ts.isSpreadAssignment(item)) writeTarget(item.expression);
          }
          return;
        }
        if (ts.isBinaryExpression(target) && target.operatorToken.kind === ts.SyntaxKind.EqualsToken) { writeTarget(target.left); return; }
        const symbol = checker!.getSymbolAtLocation(target);
        if (symbol) writes.add(symbol);
      };
      const collect = (node: ts.Node) => {
        if (ts.isFunctionLike(node)) return;
        if (ts.isAwaitExpression(node) || ts.isYieldExpression(node)) asynchronous = true;
        const target = ts.isBinaryExpression(node) && node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && node.operatorToken.kind <= ts.SyntaxKind.LastAssignment ? node.left
          : (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) && [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(node.operator) ? node.operand : undefined;
        if (target) writeTarget(target);
        ts.forEachChild(node, collect);
      };
      collect(body);
      if ((ts.isForOfStatement(region) || ts.isForInStatement(region)) && !ts.isVariableDeclarationList(region.initializer)) writeTarget(region.initializer);
      if (ts.isWhileStatement(region) || ts.isDoStatement(region)) collect(region.expression);
      if (ts.isForStatement(region)) {
        if (region.initializer) collect(region.initializer);
        if (region.condition) collect(region.condition);
        if (region.incrementor) collect(region.incrementor);
      }
      if (asynchronous) return;
      function receiver(expression: ts.Expression, visited = new Set<ts.Symbol>()): string | undefined {
        const node = unwrapExpression(expression);
        if (node.kind === ts.SyntaxKind.ThisKeyword) return 'this';
        if (!ts.isIdentifier(node) && !ts.isPropertyAccessExpression(node) && !ts.isElementAccessExpression(node)) return undefined;
        const symbol = checker!.getSymbolAtLocation(ts.isPropertyAccessExpression(node) ? node.name : node);
        if (!symbol || writes.has(symbol) || visited.has(symbol)) return undefined;
        if (symbol.declarations?.some(declaration => declaration.getSourceFile() === region.getSourceFile() && declaration.pos >= region.pos && declaration.end <= region.end)) return undefined;
        visited.add(symbol);
        const declaration = symbol.valueDeclaration;
        if (declaration && ts.isVariableDeclaration(declaration) && declaration.initializer && (declaration.parent.flags & ts.NodeFlags.Const)) {
          const alias = unwrapExpression(declaration.initializer);
          if (ts.isIdentifier(alias) || ts.isPropertyAccessExpression(alias) || ts.isElementAccessExpression(alias)) return receiver(alias, visited);
        }
        if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
          if (symbol.declarations?.some(item => ts.isGetAccessorDeclaration(item))) return undefined;
          const owner = receiver(node.expression, visited);
          return owner === undefined ? undefined : `${owner}.${symbolId(symbol)}`;
        }
        return symbolId(symbol);
      }
      // Only straight-line statements: conditional/chunked/checkpoint delivery is deliberately outside this warning.
      const statements = ts.isBlock(body) ? body.statements : ts.isExpression(body) ? [body] : [body];
      const pending = new Set<string>();
      for (const statement of statements) {
        const expression = ts.isExpressionStatement(statement) ? unwrapExpression(statement.expression)
          : ts.isExpression(statement) ? unwrapExpression(statement) : undefined;
        if (!expression || !ts.isCallExpression(expression)) { pending.clear(); continue; }
        const access = operation(expression);
        if (!access) { pending.clear(); continue; }
        const key = receiver(access.owner);
        if (!key) { pending.clear(); continue; }
        const mutation = mutations[access.name];
        const argument = mutation && expression.arguments[mutation.index];
        const applyNow = mutation ? argument ? unwrapExpression(argument).kind === ts.SyntaxKind.TrueKeyword ? true
          : unwrapExpression(argument).kind === ts.SyntaxKind.FalseKeyword ? false : undefined : mutation.defaultValue ?? false : undefined;
        const flush = access.name === 'applyUpdates' && pending.has(key) || !!mutation && applyNow === true;
        if (flush && !seen.has(expression)) {
          const node = services!.tsNodeToESTreeNodeMap.get(expression);
          if (node) {
            seen.add(expression);
            context.report({ node, messageId: 'perIteration', data: { operation: mutation ? `${access.name}(..., true)` : 'applyUpdates()', source: access.owner.getText() } });
          }
        }
        if (mutation && applyNow === false) pending.add(key);
        else pending.delete(key);
      }
    }
    return {
      'Program:exit'(node) {
        const source = services.esTreeNodeToTSNodeMap.get(node as Rule.Node);
        if (!source) return;
        const visit = (current: ts.Node) => {
          if (ts.isForStatement(current) || ts.isForInStatement(current) || ts.isWhileStatement(current) || ts.isDoStatement(current)) inspect(current, current.statement);
          if (ts.isForOfStatement(current) && !current.awaitModifier) inspect(current, current.statement);
          if (ts.isCallExpression(current) && isArrayIteration(current)) {
            const callback = current.arguments[0] && unwrapExpression(current.arguments[0]);
            if (callback && (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback)) && !callback.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword)) inspect(callback, callback.body);
          }
          ts.forEachChild(current, visit);
        };
        visit(source);
      },
    };
  },
};
export default rule;
