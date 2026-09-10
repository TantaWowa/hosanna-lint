import { Rule } from 'eslint';
import * as ts from 'typescript';
import { getLifecycleServices, isHosannaDeclaration, unwrapExpression } from '../utils/hosanna-lifecycle-api';

function removalHandlerIndex(call: ts.CallExpression, checker: ts.TypeChecker): number | undefined {
  const declaration = checker.getResolvedSignature(call)?.getDeclaration();
  if (isHosannaDeclaration(declaration, 'hosanna-ui/lib/notification-api', 'INotificationCenter', 'unsubscribe') ||
      isHosannaDeclaration(declaration, 'hosanna-ui/lib/NotificationCenter', 'NotificationCenter', 'unsubscribe')) return 1;
  if (isHosannaDeclaration(declaration, 'hosanna-list/CollectionViewDataSource', 'CollectionViewDataSource', 'removeOnDataSourceChanged')) return 0;
  return undefined;
}

function createsFreshCallback(expression: ts.Expression, checker: ts.TypeChecker): boolean {
  const callback = unwrapExpression(expression);
  if (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback)) return true;
  if (!ts.isCallExpression(callback)) return false;
  const callee = unwrapExpression(callback.expression);
  let receiver: ts.Expression;
  if (ts.isPropertyAccessExpression(callee) && callee.name.text === 'bind') receiver = callee.expression;
  else if (ts.isElementAccessExpression(callee) && ts.isStringLiteralLike(callee.argumentExpression) && callee.argumentExpression.text === 'bind') receiver = callee.expression;
  else return false;
  // An unrelated object's bind() may return a retained callback. Only Function.bind is fresh.
  const declaration = checker.getResolvedSignature(callback)?.getDeclaration();
  const sourceName = declaration?.getSourceFile().fileName.replace(/\\/g, '/');
  if (!sourceName || !/\/lib\.[^/]+\.d\.ts$/.test(sourceName)) return false;
  return checker.getNonNullableType(checker.getTypeAtLocation(receiver)).getCallSignatures().length > 0;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Reject fresh callback identities when removing Hosanna notification or CollectionViewDataSource listeners. Requires TypeScript type information.',
      recommended: true,
    },
    schema: [],
    messages: {
      freshNotificationCallback: 'LIFE-001: This creates a new callback, so notificationCenter.unsubscribe() cannot match the callback registered earlier. The old listener remains active and can retain or update a released view. Save the value returned by subscribe(), or bind the handler once, and pass that same value to unsubscribe(name, savedHandler) during owner teardown.',
      freshDataSourceCallback: 'LIFE-001: This creates a new callback, so removeOnDataSourceChanged() cannot remove the listener registered earlier. Rebinding or reusing the collection can then accumulate callbacks and duplicate updates. Retain the callback passed to onDataSourceChanged(), and pass that exact reference to removeOnDataSourceChanged(savedHandler) during owner teardown.',
    },
  },
  create(context) {
    const services = getLifecycleServices(context);
    const checker = services?.program?.getTypeChecker();
    if (!services || !checker) return {};
    return {
      CallExpression(node) {
        const call = services.esTreeNodeToTSNodeMap.get(node);
        if (!call || !ts.isCallExpression(call)) return;
        const index = removalHandlerIndex(call, checker);
        const argument = index === undefined ? undefined : call.arguments[index];
        if (!argument || !createsFreshCallback(argument, checker)) return;
        const reportNode = services.tsNodeToESTreeNodeMap.get(argument);
        if (reportNode) context.report({ node: reportNode, messageId: index === 1 ? 'freshNotificationCallback' : 'freshDataSourceCallback' });
      },
    };
  },
};

export default rule;
