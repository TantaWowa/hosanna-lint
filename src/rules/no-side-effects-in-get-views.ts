import { Rule } from 'eslint';
import * as ts from 'typescript';
import { getLifecycleServices, isHosannaDeclaration, unwrapExpression } from '../utils/hosanna-lifecycle-api';
import { isHosannaSymbol, isHosannaType } from '../utils/hosanna-view-types';

const MAX_HELPER_DEPTH = 8;
const ARRAY_CALLBACK_METHODS = new Set([
  'forEach', 'map', 'flatMap', 'filter', 'reduce', 'reduceRight', 'some', 'every',
  'find', 'findIndex', 'findLast', 'findLastIndex', 'sort', 'toSorted',
]);
const TIMER_METHODS = new Set(['setTimer', 'setTimeout', 'setInterval']);
const GLOBAL_TIMERS: Record<string, string> = {
  setTimeout: 'clearTimeout',
  setInterval: 'clearInterval',
  requestAnimationFrame: 'cancelAnimationFrame',
  requestIdleCallback: 'cancelIdleCallback',
};

type Effect = { messageId: string; api: string; cleanup?: string };
type BodyFunction = ts.MethodDeclaration | ts.ArrowFunction | ts.FunctionExpression | ts.FunctionDeclaration;

function nameOf(node: ts.Node | undefined): string | undefined {
  if (node && ts.isComputedPropertyName(node)) return nameOf(unwrapExpression(node.expression));
  if (node && (ts.isIdentifier(node) || ts.isStringLiteralLike(node) || ts.isPrivateIdentifier(node))) return node.text;
  return undefined;
}

function isDeferredFunction(node: ts.FunctionLikeDeclaration): boolean {
  return Boolean(node.asteriskToken || node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword));
}

function standardLibrary(declaration: ts.Declaration | undefined, pattern: RegExp): boolean {
  return Boolean(declaration && pattern.test(declaration.getSourceFile().fileName.replace(/\\/g, '/')));
}

function effectOf(call: ts.CallExpression, checker: ts.TypeChecker): Effect | undefined {
  const declaration = checker.getResolvedSignature(call)?.getDeclaration();
  if (!declaration) return undefined;
  for (const member of ['subscribe', 'dispatch']) {
    if (isHosannaDeclaration(declaration, 'hosanna-ui/lib/notification-api', 'INotificationCenter', member) ||
        isHosannaDeclaration(declaration, 'hosanna-ui/lib/NotificationCenter', 'NotificationCenter', member)) {
      return { messageId: member === 'subscribe' ? 'notificationSubscription' : 'notificationDispatch', api: `notificationCenter.${member}()` };
    }
  }
  if (isHosannaDeclaration(declaration, 'hosanna-ui/hosanna-api', 'HsObservable', 'addObserver')) {
    return { messageId: 'observer', api: 'HsObservable.addObserver()' };
  }
  for (const member of TIMER_METHODS) {
    if (isHosannaDeclaration(declaration, 'hosanna-bridge-core/TimerService', 'TimerService', member)) {
      return { messageId: 'timer', api: `TimerService.${member}()`, cleanup: member === 'setInterval' ? 'timerService.clearInterval' : 'timerService.clearTimeout' };
    }
  }
  if (isHosannaDeclaration(declaration, 'hosanna-bridge-core/TimerService', 'TimerService', 'registerTickable')) {
    return { messageId: 'tickable', api: 'TimerService.registerTickable()' };
  }
  if (isHosannaDeclaration(declaration, 'hosanna-ui/views/lib/BaseView', 'BaseView', 'setState') ||
      isHosannaDeclaration(declaration, 'hosanna-ui/views/lib/view-api', 'IHosannaView', 'setState')) {
    return { messageId: 'state', api: 'BaseView.setState()' };
  }
  const name = nameOf(declaration.name);
  const dom = standardLibrary(declaration, /\/lib\.(?:dom|webworker)\.d\.ts$/);
  const nodeTimers = standardLibrary(declaration, /\/@types\/node\/timers\.d\.ts$/);
  if (name && Object.prototype.hasOwnProperty.call(GLOBAL_TIMERS, name) && (dom || nodeTimers)) {
    return { messageId: 'timer', api: `${name}()`, cleanup: GLOBAL_TIMERS[name] };
  }
  if (dom && name === 'addEventListener') return { messageId: 'domListener', api: 'addEventListener()' };
  return undefined;
}

function synchronousCallbackIndex(call: ts.CallExpression, checker: ts.TypeChecker): number | undefined {
  const declaration = checker.getResolvedSignature(call)?.getDeclaration();
  if (!declaration || !standardLibrary(declaration, /\/lib\.[^/]+\.d\.ts$/)) return undefined;
  const parent = declaration.parent;
  if (!ts.isInterfaceDeclaration(parent)) return undefined;
  const name = nameOf(declaration.name);
  if (name && ARRAY_CALLBACK_METHODS.has(name) && ['Array', 'ReadonlyArray'].includes(parent.name.text)) return 0;
  if (name === 'from' && parent.name.text === 'ArrayConstructor') return 1;
  return undefined;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Reject known synchronous subscriptions, dispatches, timers, DOM listeners and live view state changes during BaseView.getViews(). Requires TypeScript type information.',
      recommended: true,
    },
    schema: [],
    messages: {
      notificationSubscription: 'LIFE-001: {{api}} runs during getViews(), so each declaration rebuild can add another subscription and retain the view. Subscribe when onViewPhaseChange receives ViewPhase.Mounted, retain the returned handle, and call unsubscribe(name, handle) when leaving Mounted; or use a lifecycle-owned @onNotification handler.',
      notificationDispatch: 'LIFE-001: {{api}} runs during getViews(), so declaration rebuilds repeat the notification and its effects. Dispatch from the semantic action or a deferred .onClick/.onInputEvent callback that owns the event.',
      observer: 'LIFE-001: {{api}} runs during getViews(), so declaration rebuilds repeatedly register an observer instead of giving it a lifecycle owner. Register when onViewPhaseChange receives ViewPhase.Mounted, and call removeObserver(key, this) when leaving Mounted.',
      timer: 'LIFE-001: {{api}} runs during getViews(), so each declaration rebuild schedules more work. Start it from a deferred event callback or when onViewPhaseChange receives ViewPhase.Mounted; retain its ID and call {{cleanup}}(id) when the owner leaves Mounted.',
      tickable: 'LIFE-001: {{api}} runs during getViews(), so declaration rebuilds register ticking work without owning its lifetime. Register when onViewPhaseChange receives ViewPhase.Mounted and call timerService.unregisterTickable with the same object and ID when leaving Mounted.',
      domListener: 'LIFE-001: {{api}} runs during getViews(), so declaration rebuilds can accumulate DOM listeners and retain the view. In the platform owner, add the listener when mounted and removeEventListener with the same target, event name, callback and capture option when unmounted.',
      state: 'PERF-001: {{api}} runs during getViews() and can schedule another declaration rebuild while the current one is being built. Put initial values in the returned ViewStruct, and change live view state from a deferred .onClick/.onInputEvent callback or the owning lifecycle hook.',
    },
  },
  create(context) {
    const services = getLifecycleServices(context);
    const checker = services?.program?.getTypeChecker();
    if (!services || !checker) return {};
    const reported = new Set<ts.CallExpression>();

    function inspectClass(node: Rule.Node): void {
      const owner = services!.esTreeNodeToTSNodeMap.get(node);
      if (!owner || (!ts.isClassDeclaration(owner) && !ts.isClassExpression(owner))) return;
      const declarationType = checker!.getTypeAtLocation(owner);
      const type = declarationType.getConstructSignatures()[0]?.getReturnType() ?? declarationType;
      if (!isHosannaType(checker!, type, ['BaseView']) || isHosannaSymbol(checker!, type.getSymbol(), 'BaseView')) return;
      const entry = owner.members.find(member => nameOf(member.name) === 'getViews' &&
        !(ts.canHaveModifiers(member) && ts.getModifiers(member)?.some(modifier => modifier.kind === ts.SyntaxKind.StaticKeyword)) &&
        ((ts.isMethodDeclaration(member) && member.body) ||
          (ts.isPropertyDeclaration(member) && member.initializer &&
            (ts.isArrowFunction(unwrapExpression(member.initializer)) || ts.isFunctionExpression(unwrapExpression(member.initializer))))));
      if (!entry) return;
      const root = ts.isMethodDeclaration(entry) ? entry
        : ts.isPropertyDeclaration(entry) && entry.initializer ? unwrapExpression(entry.initializer) : undefined;
      if (!root || (!ts.isMethodDeclaration(root) && !ts.isArrowFunction(root) && !ts.isFunctionExpression(root)) || !root.body || isDeferredFunction(root)) return;
      const visitedDepth = new Map<BodyFunction, number>();

      function sameClassFunction(declaration: ts.SignatureDeclaration | undefined): BodyFunction | undefined {
        if (declaration && ts.isMethodDeclaration(declaration) && declaration.parent === owner && declaration.body && !isDeferredFunction(declaration)) return declaration;
        if (declaration && (ts.isArrowFunction(declaration) || ts.isFunctionExpression(declaration)) && !isDeferredFunction(declaration)) {
          let parent: ts.Node = declaration.parent;
          while (ts.isParenthesizedExpression(parent) || ts.isAsExpression(parent) || ts.isSatisfiesExpression(parent)) parent = parent.parent;
          if (ts.isPropertyDeclaration(parent) && parent.parent === owner) return declaration;
        }
        return undefined;
      }

      function callbackFunction(expression: ts.Expression | undefined): BodyFunction | undefined {
        if (!expression) return undefined;
        const value = unwrapExpression(expression);
        if ((ts.isArrowFunction(value) || ts.isFunctionExpression(value)) && !isDeferredFunction(value)) return value;
        const signatures = checker!.getTypeAtLocation(value).getCallSignatures();
        for (const signature of signatures) {
          const declaration = signature.getDeclaration();
          const method = sameClassFunction(declaration);
          if (method) return method;
          if (declaration && declaration.getSourceFile() === owner!.getSourceFile() &&
              (ts.isArrowFunction(declaration) || ts.isFunctionExpression(declaration) || ts.isFunctionDeclaration(declaration)) &&
              declaration.body && !isDeferredFunction(declaration)) return declaration;
        }
        return undefined;
      }

      function visitFunction(fn: BodyFunction, depth: number): void {
        const previousDepth = visitedDepth.get(fn);
        if (depth > MAX_HELPER_DEPTH || (previousDepth !== undefined && previousDepth <= depth) || !fn.body) return;
        visitedDepth.set(fn, depth);
        visit(fn.body, depth);
      }

      function visit(current: ts.Node, depth: number): void {
        // Merely creating a callback or nested class does not execute its body.
        if (ts.isFunctionLike(current) || ts.isClassLike(current)) return;
        if (ts.isCallExpression(current)) {
          const effect = effectOf(current, checker!);
          const reportNode = effect && services!.tsNodeToESTreeNodeMap.get(current);
          if (effect && reportNode && !reported.has(current)) {
            reported.add(current);
            context.report({ node: reportNode, messageId: effect.messageId, data: { api: effect.api, cleanup: effect.cleanup ?? '' } });
          }
          // Calls in arguments execute even when the receiving API stores callbacks.
          ts.forEachChild(current, child => visit(child, depth));
          const callee = unwrapExpression(current.expression);
          if ((ts.isArrowFunction(callee) || ts.isFunctionExpression(callee)) && !isDeferredFunction(callee)) visitFunction(callee, depth + 1);
          else {
            const helper = sameClassFunction(checker!.getResolvedSignature(current)?.getDeclaration());
            if (helper) visitFunction(helper, depth + 1);
          }
          const callbackIndex = synchronousCallbackIndex(current, checker!);
          if (callbackIndex !== undefined) {
            const callback = callbackFunction(current.arguments[callbackIndex]);
            if (callback) visitFunction(callback, depth + 1);
          }
          return;
        }
        ts.forEachChild(current, child => visit(child, depth));
      }
      visitFunction(root, 0);
    }
    return { ClassDeclaration: inspectClass, ClassExpression: inspectClass };
  },
};

export default rule;
