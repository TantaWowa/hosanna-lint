import { Rule } from 'eslint';
import * as ts from 'typescript';
import {
  COMPARISON_OPERATORS,
  classifyType,
  findInterfaceDeclaration,
  isTypeAssignableToChecker,
} from '../utils/binary-comparison-type-utils';
import {
  getCachedBinaryExpressionTypes,
  getCachedTypeAtLocation,
  getTypeAwareParserServices,
  isCachedBrsNodeType,
} from '../utils/type-aware-cache';

function stripOuterParensAndNonNull(node: Rule.Node): Rule.Node {
  let n: Rule.Node = node;
  while (true) {
    const t = (n as { type?: string }).type;
    if (t === 'ParenthesizedExpression') {
      n = (n as unknown as { expression: Rule.Node }).expression;
      continue;
    }
    if (t === 'TSNonNullExpression') {
      n = (n as unknown as { expression: Rule.Node }).expression;
      continue;
    }
    break;
  }
  return n;
}

/**
 * When the operand is `(expr as T)` / `<T>expr`, returns `expr` (with outer parens/non-null stripped).
 * Otherwise null — the comparison is not driven by a top-level assertion.
 */
function getOperandInsideTypeAssertion(node: Rule.Node): Rule.Node | null {
  const n = stripOuterParensAndNonNull(node);
  const t = (n as { type?: string }).type;
  if (t === 'TSAsExpression' || t === 'TSTypeAssertion') {
    return stripOuterParensAndNonNull((n as unknown as { expression: Rule.Node }).expression);
  }
  return null;
}

function typeIsAnyOrUnknown(t: ts.Type): boolean {
  return !!(t.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown));
}

/**
 * HS-1054 / HS-1058: Transpiler rewrites equality on two IHsIdentifiable-shaped values to _hid
 * comparison and emits a warning (explicit IHsIdentifiable vs known-class variants).
 */
const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'HS-1054: Disallow direct ===/!==/==/!= on two values that both conform to IHsIdentifiable; transpiler uses _hid instead.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      ihsIdentifiableBinaryComparison:
        'HS-1054: Comparing two IHsIdentifiable values with {{operator}} is rewritten to _hid comparison at transpile time. Compare _hid (or another stable field) explicitly if that is not what you want.',
    },
  },
  create: function (context) {
    const parserServices = getTypeAwareParserServices(context);

    return {
      BinaryExpression: function (node) {
        if (!parserServices) return;
        if (!COMPARISON_OPERATORS.has(node.operator)) return;

        try {
          const { checker, leftType, rightType } = getCachedBinaryExpressionTypes(
            context.sourceCode,
            parserServices,
            node as unknown as Rule.Node & { left: Rule.Node; right: Rule.Node }
          );

          const isLeftBrs = isCachedBrsNodeType(leftType);
          const isRightBrs = isCachedBrsNodeType(rightType);
          if (isLeftBrs && isRightBrs) return;
          if (isLeftBrs !== isRightBrs) return;

          const leftClass = classifyType(leftType, checker);
          const rightClass = classifyType(rightType, checker);

          if (leftClass !== 'object' || rightClass !== 'object') return;

          const program = parserServices.program;
          const ifaceDecl = findInterfaceDeclaration(program, 'IHsIdentifiable');
          if (!ifaceDecl) return;

          const ifaceSym = checker.getSymbolAtLocation(ifaceDecl.name);
          if (!ifaceSym) return;
          const ifaceType = checker.getDeclaredTypeOfSymbol(ifaceSym);

          const leftOk = isTypeAssignableToChecker(checker, leftType, ifaceType);
          const rightOk = isTypeAssignableToChecker(checker, rightType, ifaceType);
          if (!leftOk || !rightOk) return;

          // Both sides may be `as IHsIdentifiable` only to compare values that are not both
          // statically IHsIdentifiable (e.g. `unknown` / contextual `fragmentRoot?: unknown`).
          // HS-1054 is aimed at "two already-identifiable values compared with ==="; skip the noise here.
          const leftInner = getOperandInsideTypeAssertion(node.left as Rule.Node);
          const rightInner = getOperandInsideTypeAssertion(node.right as Rule.Node);
          if (leftInner && rightInner) {
            const leftInnerType = getCachedTypeAtLocation(context.sourceCode, parserServices, leftInner);
            const rightInnerType = getCachedTypeAtLocation(context.sourceCode, parserServices, rightInner);
            if (typeIsAnyOrUnknown(leftInnerType) || typeIsAnyOrUnknown(rightInnerType)) {
              return;
            }
          }

          context.report({
            node,
            messageId: 'ihsIdentifiableBinaryComparison',
            data: {
              operator: node.operator,
            },
          });
        } catch {
          // Skip if type lookup fails
        }
      },
    };
  },
};

export default rule;
