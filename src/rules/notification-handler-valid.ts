import { Rule } from 'eslint';
import * as ts from 'typescript';
import { getLifecycleServices, isHosannaFunctionCall, unwrapExpression } from '../utils/hosanna-lifecycle-api';

const notificationModule = 'hosanna-ui/lib/notification-api';

function runtimeArity(method: ts.MethodDeclaration): number {
  let count = 0;
  for (const parameter of method.parameters) {
    if (ts.isIdentifier(parameter.name) && parameter.name.text === 'this') continue;
    if (parameter.initializer || parameter.dotDotDotToken) break;
    count++;
  }
  return count;
}

function knownNotificationName(argument: ts.Expression | undefined, checker: ts.TypeChecker | undefined): string | undefined {
  if (!argument) return undefined;
  const value = unwrapExpression(argument);
  if (ts.isStringLiteralLike(value)) return value.text;
  const type = checker?.getTypeAtLocation(value);
  return type?.isStringLiteral() ? type.value : undefined;
}

function isDirectNotificationImport(node: Rule.Node, context: Rule.RuleContext): boolean {
  // Get the binding at the use site, so a parameter shadowing an import is harmless.
  const call = node as Rule.Node & { callee: Rule.Node & { name?: string; object?: Rule.Node & { name?: string }; property?: Rule.Node & { name?: string }; computed?: boolean } };
  const callee = call.callee;
  const namespace = callee.type === 'MemberExpression' && !callee.computed && callee.property?.name === 'onNotification';
  const identifier = namespace ? callee.object : callee;
  if (identifier?.type !== 'Identifier' || !identifier.name) return false;
  let scope: ReturnType<typeof context.sourceCode.getScope> | null = context.sourceCode.getScope(identifier);
  while (scope) {
    const binding = scope.set.get(identifier.name);
    if (binding) {
      return binding.defs.some(definition => {
        if (definition.type !== 'ImportBinding') return false;
        const imported = definition.node;
        const source = definition.parent?.source;
        if (source?.value !== `@hs-src/${notificationModule}`) return false;
        if (namespace) return imported.type === 'ImportNamespaceSpecifier';
        return imported.type === 'ImportSpecifier' &&
          (imported.imported.type === 'Identifier' ? imported.imported.name : imported.imported.value) === 'onNotification';
      });
    }
    scope = scope.upper;
  }
  return false;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Validate Hosanna notification handler runtime arity and duplicate notification names before class initialization throws.',
      recommended: true,
    },
    schema: [],
    messages: {
      invalidArity: 'LIFE-001: @onNotification({{notification}}) method "{{method}}" requires runtime function.length === 1; this method has {{arity}} and Hosanna will throw during class initialization. Use one notification parameter, for example handleChanged(notification: INotification<Payload>). Name it _notification when unused. A default value or rest parameter in the first position makes the runtime length zero; a TypeScript this parameter does not count.',
      duplicateNotification: 'LIFE-001: This class registers @onNotification("{{name}}") more than once. Hosanna permits one handler per notification name and throws during class initialization. Combine the work in one decorated method, or correct the notification name if these are different events.',
    },
  },
  create(context) {
    const services = getLifecycleServices(context);
    if (!services) return {};
    const checker = services.program?.getTypeChecker();
    const namesByClass = new WeakMap<ts.Node, { instance: Set<string>; static: Set<string> }>();
    return {
      CallExpression(node) {
        const call = services.esTreeNodeToTSNodeMap.get(node);
        if (!call || !ts.isCallExpression(call) || !ts.isDecorator(call.parent)) return;
        const method = call.parent.parent;
        if (!ts.isMethodDeclaration(method)) return;
        if (!isHosannaFunctionCall(call, checker, notificationModule, 'onNotification') && !isDirectNotificationImport(node, context)) return;
        const arity = runtimeArity(method);
        const name = knownNotificationName(call.arguments[0], checker);
        if (arity !== 1) {
          context.report({
            node,
            messageId: 'invalidArity',
            data: {
              arity: String(arity),
              method: ts.isIdentifier(method.name) || ts.isStringLiteralLike(method.name) ? method.name.text : method.name.getText(),
              notification: name !== undefined ? JSON.stringify(name) : call.arguments[0]?.getText() ?? '<missing name>',
            },
          });
        }
        if (name === undefined) return;
        let registrations = namesByClass.get(method.parent);
        if (!registrations) {
          registrations = { instance: new Set(), static: new Set() };
          namesByClass.set(method.parent, registrations);
        }
        // Static decorators receive the constructor; instance decorators receive its prototype.
        const names = method.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.StaticKeyword)
          ? registrations.static : registrations.instance;
        if (names.has(name)) context.report({ node, messageId: 'duplicateNotification', data: { name } });
        names.add(name);
      },
    };
  },
};

export default rule;
