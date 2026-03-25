import { Rule } from 'eslint';
import * as ts from 'typescript';
import { isBrsNodeType } from '../utils/is-brs-node-type';
import {
  COMPARISON_OPERATORS,
  classifyType,
  findInterfaceDeclaration,
  isTypeAssignableToChecker,
  shouldDelegateBinaryComparisonFromBasicToAnyUnknown,
  unionContainsObjectType,
} from '../utils/binary-comparison-type-utils';

/**
 * The transpiler's HS-1019 fires when comparing an object/interface type
 * against a primitive (string, number, boolean) that is NOT null/undefined.
 *
 * It does NOT fire when:
 * - Either side's type includes `any` or `unknown` (HS-1118 via no-any-unknown-equality-unsafe for ===/!==; transpiler skips HS-1019 for weak-top types)
 * - Both sides are BRS/SG node types (HS-1114 via no-sgnode-equality-unsafe)
 * - One side is a BRS/SG node and the other is not (error via no-mixed-brs-node-binary-comparison)
 * - Either side is null/undefined
 * - Both sides are primitives
 */
const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'HS-1019: Disallow unsafe binary comparisons for BrightScript (object vs primitive, and object vs object equality when not IHsIdentifiable).',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      nonBasicTypeComparison:
        'HS-1019: Comparing non-basic types ({{leftType}} {{operator}} {{rightType}}) is not supported in BrightScript. Only string, number, and boolean comparisons work. Consider comparing a unique field like _hid instead.',
      objectEqualityHsEqualFallback:
        'HS-1019: Comparing non-basic types ({{leftType}} {{operator}} {{rightType}}). The transpiler rewrites ===/!== to hs_equal(...) here; BrightScript reference equality is unsafe. Prefer comparing _hid or another stable primitive field when possible.',
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

          if (shouldDelegateBinaryComparisonFromBasicToAnyUnknown(leftType, rightType, node.operator, checker)) {
            return;
          }

          // Only flag: one side is object, other side is primitive
          // Object-vs-object ===/!== uses unionContainsObjectType so `IFoo | undefined === this` is flagged
          // (classifyType alone can yield `nullish` for mixed unions and skip reporting).
          // Don't flag: either side is nullish/any
          // Don't flag: both primitives
          const isMismatch =
            (leftClass === 'object' && rightClass === 'primitive') ||
            (leftClass === 'primitive' && rightClass === 'object');

          if (isMismatch) {
            context.report({
              node,
              messageId: 'nonBasicTypeComparison',
              data: {
                leftType: checker.typeToString(leftType),
                rightType: checker.typeToString(rightType),
                operator: node.operator,
              },
            });
            return;
          }

          // Transpiler HS-1019 warning path: === / !== on two non-primitive objects that are not both IHsIdentifiable
          const isStrictEquality = node.operator === '===' || node.operator === '!==';
          const leftHasObject = unionContainsObjectType(leftType, checker);
          const rightHasObject = unionContainsObjectType(rightType, checker);
          if (isStrictEquality && leftHasObject && rightHasObject) {
            const program = parserServices!.program!;
            const ifaceDecl = findInterfaceDeclaration(program, 'IHsIdentifiable');
            if (!ifaceDecl) return;

            const ifaceSym = checker.getSymbolAtLocation(ifaceDecl.name);
            if (!ifaceSym) return;
            const ifaceType = checker.getDeclaredTypeOfSymbol(ifaceSym);

            if (isTypeAssignableToChecker(checker, leftType, ifaceType)) return;
            if (isTypeAssignableToChecker(checker, rightType, ifaceType)) return;

            context.report({
              node,
              messageId: 'objectEqualityHsEqualFallback',
              data: {
                leftType: checker.typeToString(leftType),
                rightType: checker.typeToString(rightType),
                operator: node.operator,
              },
            });
          }
        } catch {
          // Skip if type lookup fails
        }
      },
    };
  },
};

export default rule;
