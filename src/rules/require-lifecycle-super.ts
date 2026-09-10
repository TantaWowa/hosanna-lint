import { Rule } from 'eslint';
import * as ts from 'typescript';
import { getHosannaTypeServices, isHosannaType, unwrapHosannaExpression } from '../utils/hosanna-view-types';

const viewObligations: Record<string, string> = {
  release: 'unsubscribe notifications, unmount the view, release its children, and remove observable registrations',
  onWillReuse: 'reset pooled state, focus, child ownership, and notification subscriptions',
  onMount: 'create and attach the renderer and apply its initial layout',
  onUnmount: 'cancel active drag, detach the view, and release its renderer',
};
const supplementaryObligations: Record<string, string> = {
  onWillRelease: 'release the owned fragment and reset supplementary presentation state',
  onWillReuse: 'reset the fragment reference and supplementary presentation state for its next owner',
};

interface Lifecycle {
  node: Rule.Node;
  method: string;
  obligation: string;
}

interface FunctionFlow {
  lifecycle?: Lifecycle;
  segments: Set<Rule.CodePathSegment>;
  calls: Set<Rule.CodePathSegment>;
  impossibleEdges: Set<string>;
  constantIfs: Map<Rule.Node, { value: boolean; incoming: Set<Rule.CodePathSegment> }>;
}

/** Find a normal exit reachable without executing the inherited lifecycle. */
function missesSuper(codePath: Rule.CodePath, flow: FunctionFlow): boolean {
  const exits = new Set(codePath.returnedSegments);
  const pending = [codePath.initialSegment];
  const seen = new Set<Rule.CodePathSegment>();
  while (pending.length) {
    const segment = pending.pop()!;
    if (!segment.reachable || seen.has(segment) || flow.calls.has(segment)) continue;
    seen.add(segment);
    if (exits.has(segment)) return true;
    pending.push(...segment.nextSegments.filter(next => !flow.impossibleEdges.has(`${segment.id}:${next.id}`)));
  }
  return false;
}

function constantBoolean(expression: ts.Expression): boolean | undefined {
  const node = unwrapHosannaExpression(expression);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.ExclamationToken) {
    const operand = constantBoolean(node.operand);
    return operand === undefined ? undefined : !operand;
  }
  return undefined;
}

function simpleArgument(expression: ts.Expression): boolean {
  const node = unwrapHosannaExpression(expression);
  return ts.isIdentifier(node) || ts.isLiteralExpression(node) || node.kind === ts.SyntaxKind.ThisKeyword
    || node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword
    || node.kind === ts.SyntaxKind.NullKeyword
    || (ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand));
}

function propertyName(name: ts.PropertyName): string | undefined {
  if (ts.isIdentifier(name) || ts.isStringLiteralLike(name)) return name.text;
  if (ts.isComputedPropertyName(name) && ts.isStringLiteralLike(name.expression)) return name.expression.text;
  return undefined;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: 'Require inherited Hosanna lifecycle work on every normal completion path of an override.', recommended: true },
    schema: [],
    messages: {
      missingSuper: '{{method}}() can complete without calling super.{{method}}(). The inherited lifecycle must {{obligation}}. Call super.{{method}}() directly on every normal completion path, outside deferred callbacks; keep custom cleanup before or after it as its ownership requires.',
    },
  },
  create(context) {
    const services = getHosannaTypeServices(context);
    if (!services) return {};
    const flows: FunctionFlow[] = [];

    function lifecycleFor(node: Rule.Node): Lifecycle | undefined {
      if (node.type !== 'FunctionExpression' && node.type !== 'ArrowFunctionExpression') return undefined;
      const member = services!.nodeAt(node.parent);
      if (!ts.isMethodDeclaration(member) && !ts.isPropertyDeclaration(member)) return undefined;
      if (member.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.StaticKeyword)) return undefined;
      const declaration = member.parent;
      if (!ts.isClassDeclaration(declaration) && !ts.isClassExpression(declaration)) return undefined;
      const method = propertyName(member.name);
      if (!method) return undefined;

      // CollectionView deliberately replaces BaseView.release: its dedicated
      // row teardown owns children that the generic recursion must not release.
      const filename = declaration.getSourceFile().fileName.replace(/\\/g, '/');
      if (method === 'release' && declaration.name?.text === 'CollectionViewView'
        && ts.isSourceFile(declaration.parent)
        && filename.endsWith('/hosanna-list/CollectionView.ts')) return undefined;

      // FragmentView mounts a pooled fragment renderer and recycles it on
      // unmount; BaseView's renderer creation/release would duplicate ownership.
      if ((method === 'onMount' || method === 'onUnmount')
        && declaration.name?.text === 'FragmentViewView'
        && ts.isSourceFile(declaration.parent)
        && filename.endsWith('/hosanna-ui/views/controls/FragmentView.ts')) return undefined;


      const declaredType = services!.checker.getTypeAtLocation(declaration);
      const type = declaredType.isClassOrInterface()
        ? declaredType
        : declaredType.getConstructSignatures()[0]?.getReturnType();
      if (!type?.isClassOrInterface()) return undefined;
      const bases = services!.checker.getBaseTypes(type);
      const obligations = bases.some(base => isHosannaType(services!.checker, base, ['BaseView']))
        ? viewObligations
        : bases.some(base => isHosannaType(services!.checker, base, ['CollectionViewSupplementaryView']))
          ? supplementaryObligations
          : undefined;
      const obligation = obligations?.[method];
      if (!obligation) return undefined;
      return { node: node.parent, method, obligation };
    }

    function markSuperCall(node: Rule.Node, beforeEvaluation: boolean): void {
      const flow = flows[flows.length - 1];
      if (!flow?.lifecycle) return;
      const call = services!.nodeAt(node);
      if (!ts.isCallExpression(call) || call.questionDotToken) return;
      // ESLint models the inherited method lookup as potentially throwing. A
      // known direct method lookup itself does not skip calling the method, but
      // evaluation of complex arguments can. Preserve those argument paths.
      if (beforeEvaluation && !call.arguments.every(simpleArgument)) return;
      const callee = unwrapHosannaExpression(call.expression);
      let name: string | undefined;
      if (ts.isPropertyAccessExpression(callee) && !callee.questionDotToken
        && callee.expression.kind === ts.SyntaxKind.SuperKeyword) name = callee.name.text;
      if (ts.isElementAccessExpression(callee) && !callee.questionDotToken
        && callee.expression.kind === ts.SyntaxKind.SuperKeyword
        && ts.isStringLiteralLike(callee.argumentExpression)) name = callee.argumentExpression.text;
      if (name !== flow.lifecycle.method) return;
      for (const segment of flow.segments) {
        if (segment.reachable) flow.calls.add(segment);
      }
    }

    return {
      onCodePathStart(codePath, node) {
        // A field initializer and its arrow function have distinct code paths
        // with the same AST node. Only the function executes the lifecycle.
        const origin = (codePath as Rule.CodePath & { origin: string }).origin;
        flows.push({ lifecycle: origin === 'function' ? lifecycleFor(node) : undefined,
          segments: new Set(), calls: new Set(), impossibleEdges: new Set(), constantIfs: new Map() });
      },
      onCodePathSegmentStart(segment, node) {
        const flow = flows[flows.length - 1];
        flow.segments.add(segment);
        // ESLint retains both if edges even for a boolean literal. Ignore only
        // edges that this literal proves impossible, without mutating its graph.
        for (const [statement, condition] of flow.constantIfs) {
          if (statement.type !== 'IfStatement') continue;
          const impossibleBranch = condition.value ? statement.alternate : statement.consequent;
          if (node === impossibleBranch || (condition.value && !statement.alternate && node === statement)) {
            for (const previous of segment.prevSegments) {
              if (condition.incoming.has(previous)) flow.impossibleEdges.add(`${previous.id}:${segment.id}`);
            }
          }
        }
      },
      onCodePathSegmentEnd(segment) {
        flows[flows.length - 1].segments.delete(segment);
      },
      IfStatement(node) {
        const flow = flows[flows.length - 1];
        if (!flow?.lifecycle) return;
        const statement = services.nodeAt(node);
        if (!ts.isIfStatement(statement)) return;
        const value = constantBoolean(statement.expression);
        if (value !== undefined) flow.constantIfs.set(node, { value, incoming: new Set(flow.segments) });
      },
      CallExpression(node) {
        markSuperCall(node, true);
      },
      'CallExpression:exit'(node) {
        markSuperCall(node, false);
      },
      onCodePathEnd(codePath) {
        const flow = flows.pop()!;
        if (flow.lifecycle && missesSuper(codePath, flow)) {
          context.report({ node: flow.lifecycle.node, messageId: 'missingSuper', data: {
            method: flow.lifecycle.method,
            obligation: flow.lifecycle.obligation,
          } });
        }
      },
    };
  },
};

export default rule;
