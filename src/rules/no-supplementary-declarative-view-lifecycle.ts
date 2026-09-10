import { Rule } from 'eslint';
import * as ts from 'typescript';
import { getHosannaTypeServices, isHosannaType, isHosannaViewType, unwrapHosannaExpression } from '../utils/hosanna-view-types';

const LIFECYCLE_HOOKS = new Set([
  'configure', 'updateContent', 'updatePresentation', 'setFocused', 'renderAt', 'setVisible',
  'onConfigure', 'onContentChanged', 'onPresentationChanged', 'prepareFragmentData',
  'measureHeight', 'shouldDisplay', 'onWillRelease', 'onWillReuse',
  'constructor',
]);
const VIEW_LIFECYCLE_CALLS = new Set(['onMount', 'onUnmount', 'setState', 'release', 'recycle', 'buildView']);
const REPARENT_CALLS = new Set(['appendChild', 'insertChild', 'replaceChild', 'removeChild']);

function memberName(node: ts.Node): string | undefined {
  if (ts.isIdentifier(node) || ts.isStringLiteralLike(node)) return node.text;
  return undefined;
}

function calledMember(node: ts.Expression): { owner: ts.Expression; name: string } | undefined {
  if (ts.isPropertyAccessExpression(node)) return { owner: node.expression, name: node.name.text };
  if (ts.isElementAccessExpression(node) && ts.isStringLiteralLike(node.argumentExpression)) {
    return { owner: node.expression, name: node.argumentExpression.text };
  }
  return undefined;
}

function isSynchronousCallback(node: ts.Node): boolean {
  let expression = node;
  while (ts.isParenthesizedExpression(expression.parent)) expression = expression.parent;
  const call = expression.parent;
  if (!ts.isCallExpression(call)) return false;
  if (call.expression === expression) return true;
  const member = calledMember(call.expression);
  return Boolean(member && ['forEach', 'map', 'filter', 'reduce', 'reduceRight', 'some', 'every', 'find', 'findIndex'].includes(member.name));
}

function lifecycleOwner(node: ts.Node): { hook: string; owner: ts.ClassLikeDeclaration; initializer?: boolean } | undefined {
  for (let ancestor = node.parent; ancestor; ancestor = ancestor.parent) {
    if (ts.isPropertyDeclaration(ancestor) && (ts.isClassDeclaration(ancestor.parent) || ts.isClassExpression(ancestor.parent))) {
      return { hook: 'field initializer', owner: ancestor.parent, initializer: true };
    }
    if (!ts.isFunctionLike(ancestor)) continue;
    if (ts.isConstructorDeclaration(ancestor)) return { hook: 'constructor', owner: ancestor.parent };
    const member = ts.isMethodDeclaration(ancestor) ? ancestor
      : ts.isArrowFunction(ancestor) && ts.isPropertyDeclaration(ancestor.parent) ? ancestor.parent : undefined;
    if (!member) {
      if (isSynchronousCallback(ancestor)) continue;
      return undefined;
    }
    if (!(ts.isClassDeclaration(member.parent) || ts.isClassExpression(member.parent))) return undefined;
    const hook = memberName(member.name);
    return hook ? { hook, owner: member.parent } : undefined;
  }
  return undefined;
}

function lifecycleMethods(owner: ts.ClassLikeDeclaration): Set<string> {
  const calls = new Map<string, Set<string>>();
  const reachable = new Set(LIFECYCLE_HOOKS);
  for (const member of owner.members) {
    const name = ts.isConstructorDeclaration(member) ? 'constructor' : member.name && memberName(member.name);
    const body = ts.isMethodDeclaration(member) || ts.isConstructorDeclaration(member) ? member.body
      : ts.isPropertyDeclaration(member) && member.initializer
        ? ts.isArrowFunction(member.initializer) ? member.initializer.body : member.initializer : undefined;
    if (!name || !body) continue;
    if (ts.isPropertyDeclaration(member) && member.initializer && !ts.isFunctionLike(member.initializer)) reachable.add(name);
    const targets = new Set<string>();
    const visit = (node: ts.Node) => {
      if (ts.isFunctionLike(node) && !isSynchronousCallback(node)) return;
      if (ts.isCallExpression(node)) {
        const call = calledMember(node.expression);
        if (call?.owner.kind === ts.SyntaxKind.ThisKeyword) targets.add(call.name);
      }
      ts.forEachChild(node, visit);
    };
    visit(body);
    calls.set(name, targets);
  }
  for (const name of reachable) {
    for (const target of calls.get(name) ?? []) reachable.add(target);
  }
  return reachable;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: 'SUP-001: Keep declarative view lifecycles out of reusable CollectionView supplementaries.', recommended: true },
    schema: [],
    messages: {
      nestedView: 'SUP-001: {{hook}} {{operation}} a declarative {{viewType}} inside a reusable supplementary. BaseView/ViewStruct lifecycles have a separate owner. Use headerSettings.headerComponent or footerSettings.footerComponent with a fragment; keep dynamic behavior in the supplementary hooks. Retained SceneGraph nodes are also supported with explicit cleanup.',
    },
  },
  create(context) {
    const services = getHosannaTypeServices(context);
    if (!services) return {};
    const { checker } = services;
    const reachableByClass = new Map<ts.ClassLikeDeclaration, Set<string>>();
    const typeOf = (node: ts.Node) => checker.getTypeAtLocation(unwrapHosannaExpression(node));
    const isDeclarative = (node: ts.Node) => isHosannaViewType(checker, typeOf(node)) || isHosannaType(checker, typeOf(node), ['ViewStruct']);

    const rendererOwner = (node: ts.Node, seen = new Set<ts.Symbol>()): ts.Node | undefined => {
      node = unwrapHosannaExpression(node);
      if (ts.isPropertyAccessExpression(node) && node.name.text === 'renderer' && isDeclarative(node.expression)) return node.expression;
      if (ts.isCallExpression(node)) {
        const member = calledMember(node.expression);
        if (member?.name === 'getRenderer' && isDeclarative(member.owner)) return member.owner;
      }
      if (ts.isIdentifier(node)) {
        const symbol = checker.getSymbolAtLocation(node);
        const declaration = symbol?.valueDeclaration;
        if (symbol && !seen.has(symbol) && declaration && ts.isVariableDeclaration(declaration)
          && declaration.initializer && (declaration.parent.flags & ts.NodeFlags.Const)) {
          seen.add(symbol);
          return rendererOwner(declaration.initializer, seen);
        }
      }
      return undefined;
    };

    const inspect = (node: Rule.Node) => {
      const expression = services.nodeAt(node);
      if (!ts.isCallExpression(expression) && !ts.isNewExpression(expression)) return;
      const lifecycle = lifecycleOwner(expression);
      if (!lifecycle || !isHosannaType(checker, typeOf(lifecycle.owner), ['CollectionViewSupplementaryView'])) return;
      const hook = lifecycle.hook;
      if (!reachableByClass.has(lifecycle.owner)) reachableByClass.set(lifecycle.owner, lifecycleMethods(lifecycle.owner));
      if (!lifecycle.initializer && !reachableByClass.get(lifecycle.owner)!.has(hook)) return;

      let operation: string | undefined;
      let viewNode: ts.Node = expression;
      if (ts.isNewExpression(expression)) {
        if (isHosannaViewType(checker, typeOf(expression))) operation = 'constructs';
      } else {
        const call = calledMember(expression.expression);
        if (!call) return;
        if (VIEW_LIFECYCLE_CALLS.has(call.name) && isDeclarative(call.owner)) {
          operation = `calls ${call.name} on`;
          viewNode = call.owner;
        } else if (isHosannaType(checker, typeOf(call.owner), ['IInstancePool'])) {
          if (call.name === 'get' && isDeclarative(expression)) operation = 'acquires';
          if (call.name === 'release' && expression.arguments[0] && isDeclarative(expression.arguments[0])) {
            operation = 'releases';
            viewNode = expression.arguments[0];
          }
        } else if (REPARENT_CALLS.has(call.name)) {
          const view = expression.arguments.map(argument => rendererOwner(argument)).find(Boolean);
          if (view) {
            operation = 'reparents the renderer of';
            viewNode = view;
          }
        }
      }
      if (operation) context.report({ node, messageId: 'nestedView', data: { hook, operation, viewType: checker.typeToString(typeOf(viewNode)) } });
    };
    return { CallExpression: inspect, NewExpression: inspect };
  },
};

export default rule;
