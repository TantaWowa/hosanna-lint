import { Rule } from 'eslint';
import * as ts from 'typescript';
import { getLifecycleServices, isHosannaDeclaration, isHosannaFunctionCall, isHosannaModule, unwrapExpression } from '../utils/hosanna-lifecycle-api';
import { isHosannaType } from '../utils/hosanna-view-types';

type BoundExpression = { expression: ts.Expression; environment: Environment; scalar?: string | number | boolean };
type Environment = Map<ts.Symbol, BoundExpression>;
type Subscription = { call: ts.CallExpression; source: string; notification?: string; identities: string[]; api: 'notification' | 'dataSource' };

function member(expression: ts.Expression) {
  const node = unwrapExpression(expression);
  if (ts.isPropertyAccessExpression(node)) return { owner: node.expression, name: node.name.text };
  if (ts.isElementAccessExpression(node) && ts.isStringLiteralLike(node.argumentExpression)) return { owner: node.expression, name: node.argumentExpression.text };
  return undefined;
}

function bodyOf(declaration: ts.Node): ts.Node | undefined {
  if (ts.isMethodDeclaration(declaration) || ts.isConstructorDeclaration(declaration) || ts.isFunctionDeclaration(declaration)) return declaration.body;
  if (ts.isPropertyDeclaration(declaration) && declaration.initializer) {
    const value = unwrapExpression(declaration.initializer);
    return ts.isArrowFunction(value) || ts.isFunctionExpression(value) ? value.body : value;
  }
  return undefined;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: { description: 'Warn when a transient Hosanna owner retains an external subscription without statically reachable matching lifecycle cleanup.', recommended: true },
    schema: [],
    messages: {
      lostIdentity: 'LIFE-001: {{owner}} registers a fresh callback with {{api}} on an external source but retains neither its callback identity nor a notification subscription result. That source can outlive this view and the callback cannot be removed by rebinding it later. {{remedy}} Pair registration with {{lifecycle}} cleanup; BaseView @onNotification handlers already have framework-owned subscription cleanup. This warning reports local ownership evidence, not a proven runtime leak.',
      missingCleanup: 'LIFE-001: {{owner}} registers with {{api}} on an external source, but no matching removal of the same source{{notification}} and callback/subscription identity is reachable from {{lifecycle}}. {{remedy}} Call the cleanup helper from the owner lifecycle; an unused stop() method is not cleanup. This checks statically reachable local/inherited helpers, not every runtime path or delegated ownership.',
    },
  },
  create(context) {
    const services = getLifecycleServices(context);
    const checker = services?.program?.getTypeChecker();
    if (!services || !checker) return {};
    const ids = new Map<ts.Symbol, number>();
    const symbolId = (symbol: ts.Symbol) => {
      if (!ids.has(symbol)) ids.set(symbol, ids.size);
      return String(ids.get(symbol));
    };
    function api(call: ts.CallExpression): { kind: 'notification' | 'dataSource'; registration: boolean } | undefined {
      const access = member(call.expression);
      const declaration = checker!.getResolvedSignature(call)?.getDeclaration();
      if (!access) return undefined;
      if (['subscribe', 'unsubscribe'].includes(access.name) && (
        isHosannaDeclaration(declaration, 'hosanna-ui/lib/notification-api', 'INotificationCenter', access.name) ||
        isHosannaDeclaration(declaration, 'hosanna-ui/lib/NotificationCenter', 'NotificationCenter', access.name))) {
        return { kind: 'notification', registration: access.name === 'subscribe' };
      }
      if (['onDataSourceChanged', 'removeOnDataSourceChanged'].includes(access.name) &&
        isHosannaDeclaration(declaration, 'hosanna-list/CollectionViewDataSource', 'CollectionViewDataSource', access.name)) {
        return { kind: 'dataSource', registration: access.name === 'onDataSourceChanged' };
      }
      return undefined;
    }
    function inspect(owner: ts.ClassLikeDeclaration) {
      const ownerType = checker!.getTypeAtLocation(owner);
      const supplementary = isHosannaType(checker!, ownerType, ['CollectionViewSupplementaryView']);
      if (!supplementary && !isHosannaType(checker!, ownerType, ['BaseView'])) return;
      if (isHosannaType(checker!, ownerType, ['BaseApp'])) return;
      if (owner.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.DeclareKeyword)) return;
      const lifecycle = supplementary ? 'onWillRelease()' : 'release()/onUnmount() or onViewPhaseChange(ViewPhase.Unmounted)';
      const empty: Environment = new Map();
      function dereference(expression: ts.Expression, environment: Environment): BoundExpression {
        const node = unwrapExpression(expression);
        const symbol = ts.isIdentifier(node) && checker!.getSymbolAtLocation(node);
        const value = symbol && environment.get(symbol);
        return value ? value.scalar !== undefined ? value : dereference(value.expression, value.environment) : { expression: node, environment };
      }
      function symbolAt(expression: ts.Expression): ts.Symbol | undefined {
        const access = member(expression);
        if (access && access.owner.kind === ts.SyntaxKind.ThisKeyword) return ownerType.getProperty(access.name);
        return checker!.getSymbolAtLocation(ts.isPropertyAccessExpression(expression) ? expression.name : expression);
      }
      function key(expression: ts.Expression, environment = empty, seen = new Set<ts.Symbol>()): string | undefined {
        const resolved = dereference(expression, environment);
        const node = resolved.expression;
        environment = resolved.environment;
        if (node.kind === ts.SyntaxKind.ThisKeyword) return 'this';
        const symbol = symbolAt(node);
        if (!symbol || seen.has(symbol)) return undefined;
        seen.add(symbol);
        if (ts.isIdentifier(node)) {
          const declaration = symbol.valueDeclaration;
          if (declaration && ts.isVariableDeclaration(declaration) && declaration.initializer && (declaration.parent.flags & ts.NodeFlags.Const)) {
            const initializer = unwrapExpression(declaration.initializer);
            if (ts.isIdentifier(initializer) || ts.isPropertyAccessExpression(initializer) || ts.isElementAccessExpression(initializer)) return key(initializer, environment, seen);
          }
          return `symbol:${symbolId(symbol)}`;
        }
        const access = member(node);
        if (!access || symbol.declarations?.some(declaration => ts.isGetAccessorDeclaration(declaration))) return undefined;
        const receiver = key(access.owner, environment, seen);
        return receiver === undefined ? undefined : `${receiver}.${symbolId(symbol)}`;
      }
      function nameOf(expression: ts.Expression | undefined, environment = empty): string | undefined {
        if (!expression) return undefined;
        const resolved = dereference(expression, environment);
        if (ts.isStringLiteralLike(resolved.expression)) return resolved.expression.text;
        const type = checker!.getTypeAtLocation(resolved.expression);
        return type.isStringLiteral() ? type.value : undefined;
      }
      function scalar(expression: ts.Expression, environment = empty): string | number | boolean | undefined {
        const resolved = dereference(expression, environment);
        if (resolved.scalar !== undefined) return resolved.scalar;
        const node = resolved.expression;
        environment = resolved.environment;
        if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
        if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
        if (ts.isStringLiteralLike(node)) return node.text;
        if (ts.isNumericLiteral(node)) return Number(node.text);
        if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
          // Query the type first: TypeScript may not yet have populated a property
          // access's enum constant cache during an ESLint-only program traversal.
          const type = checker!.getTypeAtLocation(node);
          return checker!.getConstantValue(node) ?? (type.isNumberLiteral() || type.isStringLiteral() ? type.value : undefined);
        }
        if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.ExclamationToken) {
          const operand = scalar(node.operand, environment);
          return operand === undefined ? undefined : !operand;
        }
        if (ts.isBinaryExpression(node)) {
          const left = scalar(node.left, environment);
          const right = scalar(node.right, environment);
          if (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
            if (left === false || right === false) return false;
            if (left === true) return right;
            if (right === true) return left;
          }
          if (node.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
            if (left === true || right === true) return true;
            if (left === false) return right;
            if (right === false) return left;
          }
          if (left !== undefined && right !== undefined) {
            if (node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken) return left === right;
            if (node.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken) return left !== right;
            // Coercing comparisons of different primitive types remain unresolved.
            if (typeof left === typeof right) {
              if (node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsToken) return left === right;
              if (node.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsToken) return left !== right;
            }
          }
        }
        return undefined;
      }
      function ownership(expression: ts.Expression, seen = new Set<ts.Symbol>()): 'external' | 'local' | undefined {
        const node = unwrapExpression(expression);
        if (ts.isNewExpression(node)) return 'local';
        if (ts.isCallExpression(node) && isHosannaDeclaration(checker!.getResolvedSignature(node)?.getDeclaration(), 'hosanna-bridge-core/AppUtils', 'AppUtils', 'resolve')) return 'external';
        const symbol = symbolAt(node);
        if (!symbol || seen.has(symbol)) return undefined;
        seen.add(symbol);
        const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0];
        if (!declaration) return undefined;
        if (ts.isParameter(declaration) && ts.isConstructorDeclaration(declaration.parent)) return 'external';
        if (ts.isPropertyDeclaration(declaration)) {
          if (ts.getDecorators(declaration)?.some(decorator => ts.isCallExpression(decorator.expression) &&
            isHosannaFunctionCall(decorator.expression, checker, 'hosanna-bridge-core/decorators', 'inject'))) return 'external';
          if (declaration.initializer) return ownership(declaration.initializer, seen);
          // A property assigned from a constructor-supplied collaborator has an external owner.
          for (const constructor of owner.members.filter(ts.isConstructorDeclaration)) {
            let result: 'external' | 'local' | undefined;
            const visit = (current: ts.Node) => {
              if (ts.isBinaryExpression(current) && current.operatorToken.kind === ts.SyntaxKind.EqualsToken && symbolAt(current.left) === symbol) result = ownership(current.right, new Set(seen));
              ts.forEachChild(current, visit);
            };
            if (constructor.body) visit(constructor.body);
            if (result) return result;
          }
        }
        if (ts.isVariableDeclaration(declaration) && declaration.initializer) return ownership(declaration.initializer, seen);
        return undefined;
      }
      function capturedResult(call: ts.CallExpression): ts.Expression | undefined {
        let expression: ts.Node = call;
        while (ts.isParenthesizedExpression(expression.parent) || ts.isAsExpression(expression.parent) || ts.isNonNullExpression(expression.parent)) expression = expression.parent;
        const parent = expression.parent;
        if (ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.EqualsToken && parent.right === expression) return parent.left;
        if (ts.isVariableDeclaration(parent) && parent.initializer === expression && ts.isIdentifier(parent.name)) return parent.name;
        if (ts.isPropertyDeclaration(parent) && parent.initializer === expression && (ts.isIdentifier(parent.name) || ts.isStringLiteralLike(parent.name))) {
          // Use the same property key as this.field in cleanup without synthesizing TypeScript AST.
          return undefined;
        }
        return undefined;
      }
      const subscriptions: Subscription[] = [];
      const ownVisit = (current: ts.Node) => {
        if (ts.isFunctionLike(current) || ts.isClassLike(current)) return;
        if (ts.isCallExpression(current)) {
          const kind = api(current);
          const access = member(current.expression);
          if (kind?.registration && access && ownership(access.owner) === 'external') {
            const source = key(access.owner);
            const notification = kind.kind === 'notification' ? nameOf(current.arguments[0]) : undefined;
            const callback = current.arguments[kind.kind === 'notification' ? 1 : 0];
            if (source && callback && (kind.kind === 'dataSource' || notification !== undefined)) {
              const identities: string[] = [];
              const callbackKey = key(callback);
              if (callbackKey) identities.push(callbackKey);
              if (kind.kind === 'notification') {
                const captured = capturedResult(current);
                const capturedKey = captured && key(captured);
                if (capturedKey) identities.push(capturedKey);
                const parent = current.parent;
                if (ts.isPropertyDeclaration(parent)) {
                  const symbol = (ts.isIdentifier(parent.name) || ts.isStringLiteralLike(parent.name)) ? ownerType.getProperty(parent.name.text) : undefined;
                  if (symbol) identities.push(`this.${symbolId(symbol)}`);
                }
              }
              subscriptions.push({ call: current, source, notification, identities, api: kind.kind });
            }
          }
        }
        ts.forEachChild(current, ownVisit);
      };
      for (const declaration of owner.members) {
        const body = bodyOf(declaration);
        if (body) ownVisit(body);
      }
      if (!subscriptions.length) return;
      // A const subscription result may be copied to an owner field before the setup method returns.
      const retain = (node: ts.Node) => {
        if (ts.isFunctionLike(node) || ts.isClassLike(node)) return;
        if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
          const destination = member(node.left);
          const source = unwrapExpression(node.right);
          const declaration = ts.isIdentifier(source) ? checker!.getSymbolAtLocation(source)?.valueDeclaration : undefined;
          if (destination?.owner.kind === ts.SyntaxKind.ThisKeyword && declaration && ts.isVariableDeclaration(declaration)
            && (declaration.parent.flags & ts.NodeFlags.Const)) {
            const original = key(source);
            const retained = key(node.left);
            for (const subscription of subscriptions) {
              if (original && retained && subscription.identities.includes(original)) subscription.identities.push(retained);
            }
          }
        }
        ts.forEachChild(node, retain);
      };
      for (const declaration of owner.members) {
        const body = bodyOf(declaration);
        if (body) retain(body);
      }
      type Walk = { removals: Subscription[]; registrations: Set<ts.CallExpression>; visited: Set<string>; unmountDispatch: boolean };
      const makeWalk = (): Walk => ({ removals: [], registrations: new Set(), visited: new Set(), unmountDispatch: false });
      function method(name: string): ts.Declaration | undefined {
        const symbol = ownerType.getProperty(name);
        return symbol?.valueDeclaration ?? symbol?.declarations?.[0];
      }
      function reachable(declaration: ts.Node, environment: Environment, walk: Walk, depth = 0) {
        const body = bodyOf(declaration);
        if (!body || depth > 16) return;
        if (isHosannaDeclaration(declaration, 'hosanna-ui/views/lib/BaseView', 'BaseView', 'onUnmount')) walk.unmountDispatch = true;
        const signature = `${declaration.getSourceFile().fileName}:${declaration.pos}:${[...environment].map(([symbol, binding]) => `${symbolId(symbol)}=${binding.scalar ?? scalar(binding.expression, binding.environment) ?? key(binding.expression, binding.environment) ?? nameOf(binding.expression, binding.environment)}`).join(',')}`;
        if (walk.visited.has(signature)) return;
        walk.visited.add(signature);
        const visit = (current: ts.Node) => {
          if (ts.isFunctionLike(current) || ts.isClassLike(current)) return;
          if (ts.isIfStatement(current)) {
            const condition = scalar(current.expression, environment);
            if (condition === false) { if (current.elseStatement) visit(current.elseStatement); return; }
            if (condition === true) { visit(current.thenStatement); return; }
          }
          if (ts.isSwitchStatement(current)) {
            const selected = scalar(current.expression, environment);
            if (selected !== undefined) {
              const clauses = current.caseBlock.clauses;
              let start = clauses.findIndex(clause => ts.isCaseClause(clause) && scalar(clause.expression, environment) === selected);
              if (start < 0) start = clauses.findIndex(ts.isDefaultClause);
              if (start < 0) return;
              for (const clause of clauses.slice(start)) {
                for (const statement of clause.statements) {
                  if (ts.isBreakStatement(statement)) return;
                  visit(statement);
                  if (ts.isReturnStatement(statement) || ts.isThrowStatement(statement)) return;
                }
              }
              return;
            }
          }
          if (ts.isBlock(current)) {
            for (const statement of current.statements) {
              visit(statement);
              if (ts.isReturnStatement(statement) || ts.isThrowStatement(statement)) break;
            }
            return;
          }
          if (ts.isCallExpression(current)) {
            const kind = api(current);
            const access = member(current.expression);
            if (kind?.registration) walk.registrations.add(current);
            if (kind && !kind.registration && access) {
              const source = key(access.owner, environment);
              const notification = kind.kind === 'notification' ? nameOf(current.arguments[0], environment) : undefined;
              const callback = current.arguments[kind.kind === 'notification' ? 1 : 0];
              const identity = callback && key(callback, environment);
              if (source && identity) walk.removals.push({ call: current, source, notification, identities: [identity], api: kind.kind });
            }
            let target: ts.Declaration | undefined;
            if (access?.owner.kind === ts.SyntaxKind.ThisKeyword) target = method(access.name);
            else if (access?.owner.kind === ts.SyntaxKind.SuperKeyword) target = checker!.getResolvedSignature(current)?.getDeclaration();
            else {
              const resolved = checker!.getResolvedSignature(current)?.getDeclaration();
              // Imported/namespace named function helpers are synchronous calls; arbitrary object methods are unresolved owners.
              if (resolved && ts.isFunctionDeclaration(resolved)) target = resolved;
            }
            if (target && (ts.isMethodDeclaration(target) || ts.isFunctionDeclaration(target) || ts.isPropertyDeclaration(target))) {
              const next = new Map(environment);
              const parameters = ts.isPropertyDeclaration(target) && target.initializer && ts.isArrowFunction(target.initializer) ? target.initializer.parameters
                : ts.isMethodDeclaration(target) || ts.isFunctionDeclaration(target) ? target.parameters : [];
              parameters.forEach((parameter, index) => {
                const symbol = checker!.getSymbolAtLocation(parameter.name);
                if (symbol && current.arguments[index]) next.set(symbol, { expression: current.arguments[index], environment });
              });
              reachable(target, next, walk, depth + 1);
            }
          }
          ts.forEachChild(current, visit);
        };
        visit(body);
      }
      function frameworkHook(name: string, type = ownerType, seen = new Set<ts.Type>()): ts.MethodDeclaration | undefined {
        if (seen.has(type)) return undefined;
        seen.add(type);
        const declaration = type.getProperty(name)?.valueDeclaration;
        if (declaration && ts.isMethodDeclaration(declaration) &&
            isHosannaDeclaration(declaration, 'hosanna-ui/views/lib/BaseView', 'BaseView', name)) return declaration;
        if ((type.flags & ts.TypeFlags.Object) && ((type as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference)) {
          const target = (type as ts.TypeReference).target;
          if (target !== type) {
            const inherited = frameworkHook(name, target, seen);
            if (inherited) return inherited;
          }
        }
        if (type.isClassOrInterface()) for (const base of checker!.getBaseTypes(type)) {
          const inherited = frameworkHook(name, base, seen);
          if (inherited) return inherited;
        }
        return undefined;
      }
      const lifetime = makeWalk();
      for (const name of supplementary ? ['onWillRelease'] : ['release', 'onUnmount']) {
        const declaration = method(name);
        if (declaration) reachable(declaration, empty, lifetime);
      }
      function walkPhase(phase: 'Mounted' | 'Unmounted', walk: Walk): void {
        // The BaseView.viewPhase setter dispatches this hook. Bind the real
        // framework enum value, not a namesake method/enum.
        const hook = frameworkHook('onViewPhaseChange');
        const phaseType = hook?.parameters[0] && checker!.getTypeAtLocation(hook.parameters[0]);
        const phaseSymbol = phaseType?.aliasSymbol ?? phaseType?.getSymbol();
        const enumDeclaration = phaseSymbol?.declarations?.find(declaration => ts.isEnumDeclaration(declaration) &&
          declaration.name.text === 'ViewPhase' && isHosannaModule(declaration.getSourceFile().fileName, 'hosanna-ui/lib/renderer-api'));
        const unmounted = enumDeclaration && ts.isEnumDeclaration(enumDeclaration)
          ? enumDeclaration.members.find(member => member.name.getText() === phase) : undefined;
        const value = unmounted && checker!.getConstantValue(unmounted);
        const target = method('onViewPhaseChange');
        if (value !== undefined && target && ts.isMethodDeclaration(target) && target.parameters[0]) {
          const parameter = target.parameters[0].name;
          const symbol = checker!.getSymbolAtLocation(parameter);
          if (symbol && ts.isIdentifier(parameter)) reachable(target, new Map([[symbol, { expression: parameter, environment: empty, scalar: value }]]), walk);
        }
      }
      if (!supplementary && lifetime.unmountDispatch) walkPhase('Unmounted', lifetime);
      const presentation = makeWalk();
      const dismissal = makeWalk();
      const mounted = makeWalk();
      if (!supplementary) {
        walkPhase('Mounted', mounted);
        for (const name of ['onAppear', 'onDidAppearInAggregateView', 'onDidReappearInAggregateView']) {
          const declaration = frameworkHook(name) && method(name);
          if (declaration) reachable(declaration, empty, presentation);
        }
        for (const name of ['onDisappear', 'onDisappearFromAggregateView', 'onWillRemoveFromAggregateView', 'onDidRemoveFromAggregateView']) {
          const declaration = frameworkHook(name) && method(name);
          if (declaration) reachable(declaration, empty, dismissal);
        }
        for (const name of ['onMount', 'onConfigure']) {
          const declaration = method(name);
          if (declaration) reachable(declaration, empty, mounted);
        }
        for (const declaration of owner.members) {
          if (ts.isConstructorDeclaration(declaration)) reachable(declaration, empty, mounted);
          if (ts.isPropertyDeclaration(declaration) && declaration.initializer) {
            const initializer = unwrapExpression(declaration.initializer);
            // A callback field is declared during construction but runs only when called.
            if (!ts.isArrowFunction(initializer) && !ts.isFunctionExpression(initializer)) reachable(declaration, empty, mounted);
          }
        }
      }
      for (const subscription of subscriptions) {
        const presentationOwned = presentation.registrations.has(subscription.call) && !mounted.registrations.has(subscription.call);
        const removals = presentationOwned ? [...lifetime.removals, ...dismissal.removals] : lifetime.removals;
        if (removals.some(removal => removal.api === subscription.api && removal.source === subscription.source && removal.notification === subscription.notification && removal.identities.some(identity => subscription.identities.includes(identity)))) continue;
        const node = services!.tsNodeToESTreeNodeMap.get(subscription.call);
        if (!node) continue;
        const notification = subscription.notification === undefined ? '' : `, notification ${JSON.stringify(subscription.notification)}`;
        context.report({ node, messageId: subscription.identities.length ? 'missingCleanup' : 'lostIdentity', data: {
          owner: owner.name?.text ?? 'This owner', api: subscription.api === 'notification' ? 'NotificationCenter.subscribe()' : 'CollectionViewDataSource.onDataSourceChanged()', notification, lifecycle: presentationOwned ? 'onDisappear()/aggregate-view removal hooks or ' + lifecycle : lifecycle,
          remedy: subscription.api === 'notification' ? 'Store the subscribe() result and pass it to center.unsubscribe(name, savedSubscription), or retain the original callback.' : 'Bind the callback once, retain it, and pass that exact reference to dataSource.removeOnDataSourceChanged(savedCallback).',
        } });
      }
    }
    return {
      'Program:exit'(node) {
        const source = services.esTreeNodeToTSNodeMap.get(node as Rule.Node);
        if (!source) return;
        const visit = (current: ts.Node) => {
          if (ts.isClassDeclaration(current) || ts.isClassExpression(current)) inspect(current);
          ts.forEachChild(current, visit);
        };
        visit(source);
      },
    };
  },
};
export default rule;
