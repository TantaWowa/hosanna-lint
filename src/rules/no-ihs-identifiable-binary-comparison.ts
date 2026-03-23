import { Rule } from 'eslint';
import * as ts from 'typescript';
import { isBrsNodeType } from '../utils/is-brs-node-type';
import {
  COMPARISON_OPERATORS,
  classifyType,
  findInterfaceDeclaration,
  isTypeAssignableToChecker,
} from '../utils/binary-comparison-type-utils';

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
    const parserServices = context.sourceCode?.parserServices as
      | { program?: ts.Program; getTypeAtLocation?: (node: Rule.Node) => ts.Type }
      | undefined;

    const hasTypeInfo =
      parserServices?.program && typeof parserServices.getTypeAtLocation === 'function';

    return {
      BinaryExpression: function (node) {
        if (!hasTypeInfo) return;
        if (!COMPARISON_OPERATORS.has(node.operator)) return;

        try {
          const checker = parserServices!.program!.getTypeChecker();
          const leftType = parserServices!.getTypeAtLocation!(node.left as Rule.Node);
          const rightType = parserServices!.getTypeAtLocation!(node.right as Rule.Node);

          const leftClass = classifyType(leftType, checker);
          const rightClass = classifyType(rightType, checker);

          const isLeftBrs = isBrsNodeType(leftType);
          const isRightBrs = isBrsNodeType(rightType);
          if (isLeftBrs && isRightBrs) return;
          if (isLeftBrs !== isRightBrs) return;

          if (leftClass !== 'object' || rightClass !== 'object') return;

          const program = parserServices!.program!;
          const ifaceDecl = findInterfaceDeclaration(program, 'IHsIdentifiable');
          if (!ifaceDecl) return;

          const ifaceSym = checker.getSymbolAtLocation(ifaceDecl.name);
          if (!ifaceSym) return;
          const ifaceType = checker.getDeclaredTypeOfSymbol(ifaceSym);

          const leftOk = isTypeAssignableToChecker(checker, leftType, ifaceType);
          const rightOk = isTypeAssignableToChecker(checker, rightType, ifaceType);
          if (!leftOk || !rightOk) return;

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
