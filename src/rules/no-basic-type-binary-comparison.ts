import { Rule } from 'eslint';
import * as ts from 'typescript';
import { isBrsNodeType } from '../utils/is-brs-node-type';

const COMPARISON_OPERATORS = new Set(['===', '!==', '==', '!=']);

/**
 * The transpiler's HS-1019 fires when comparing an object/interface type
 * against a primitive (string, number, boolean) that is NOT null/undefined.
 *
 * It does NOT fire when:
 * - Both sides are BRS/SG node types (HS-1114 via no-sgnode-equality-unsafe)
 * - One side is a BRS/SG node and the other is not (error via no-mixed-brs-node-binary-comparison)
 * - Either side is null/undefined
 * - Both sides are primitives
 */
function isPrimitive(type: ts.Type): boolean {
  if (type.flags & ts.TypeFlags.StringLike) return true;
  if (type.flags & ts.TypeFlags.NumberLike) return true;
  if (type.flags & ts.TypeFlags.BooleanLike) return true;
  if (type.flags & ts.TypeFlags.Enum || type.flags & ts.TypeFlags.EnumLiteral) return true;
  if (type.isLiteral()) {
    const baseFlags = type.flags;
    if (baseFlags & (ts.TypeFlags.StringLiteral | ts.TypeFlags.NumberLiteral | ts.TypeFlags.BooleanLiteral)) return true;
  }
  return false;
}

function isNullishOrAny(type: ts.Type): boolean {
  if (type.flags & ts.TypeFlags.Null) return true;
  if (type.flags & ts.TypeFlags.Undefined) return true;
  if (type.flags & ts.TypeFlags.Void) return true;
  if (type.flags & ts.TypeFlags.Any) return true;
  if (type.flags & ts.TypeFlags.Unknown) return true;
  if (type.flags & ts.TypeFlags.Never) return true;
  return false;
}

function classifyType(type: ts.Type, checker: ts.TypeChecker): 'primitive' | 'nullish' | 'object' {
  if (isNullishOrAny(type)) return 'nullish';
  if (isPrimitive(type)) return 'primitive';

  // Handle TypeParameter (generics like K, T, etc.)
  // Check their constraint - if constrained to string/number, treat as primitive
  if (type.flags & ts.TypeFlags.TypeParameter) {
    const constraint = checker.getBaseConstraintOfType(type);
    if (constraint) return classifyType(constraint, checker);
    return 'nullish'; // unconstrained generic - don't flag
  }

  // Handle Index (T[K], T["key"]) - the resolved type is what matters
  if (type.flags & ts.TypeFlags.Index) {
    return 'nullish'; // keyof T is always string | number | symbol - don't flag
  }

  // Handle IndexedAccess (T[K]) - resolve via base constraint
  if (type.flags & ts.TypeFlags.IndexedAccess) {
    const constraint = checker.getBaseConstraintOfType(type);
    if (constraint) return classifyType(constraint, checker);
    return 'nullish';
  }

  // Handle Conditional types
  if (type.flags & ts.TypeFlags.Conditional || type.flags & ts.TypeFlags.Substitution) {
    const constraint = checker.getBaseConstraintOfType(type);
    if (constraint) return classifyType(constraint, checker);
    return 'nullish';
  }

  if (type.isUnion()) {
    const classifications = type.types.map(t => classifyType(t, checker));
    const hasObject = classifications.includes('object');
    const hasPrimitive = classifications.includes('primitive');
    if (hasObject && hasPrimitive) return 'nullish'; // ambiguous, don't flag
    if (hasObject) return 'object';
    if (hasPrimitive) return 'primitive';
    return 'nullish';
  }

  if (type.isIntersection()) {
    // If any part is a primitive, treat as primitive
    for (const t of type.types) {
      const c = classifyType(t, checker);
      if (c === 'primitive') return 'primitive';
    }
    // If all parts are nullish, return nullish
    if (type.types.every(t => classifyType(t, checker) === 'nullish')) return 'nullish';
    return 'object';
  }

  // Function types are callable objects
  if (type.getCallSignatures().length > 0) return 'object';

  return 'object';
}

/** Assignability check (TypeChecker API; ESLint-facing Program typings may omit the method). */
function isTypeAssignableToChecker(checker: ts.TypeChecker, source: ts.Type, target: ts.Type): boolean {
  const fn = (checker as unknown as { isTypeAssignableTo(s: ts.Type, t: ts.Type): boolean }).isTypeAssignableTo;
  return fn.call(checker, source, target);
}

function findInterfaceDeclaration(program: ts.Program, interfaceName: string): ts.InterfaceDeclaration | undefined {
  let found: ts.InterfaceDeclaration | undefined;
  function visit(n: ts.Node): void {
    if (found) return;
    if (ts.isInterfaceDeclaration(n) && n.name.text === interfaceName) {
      found = n;
      return;
    }
    ts.forEachChild(n, visit);
  }
  for (const sf of program.getSourceFiles()) {
    visit(sf);
    if (found) return found;
  }
  return undefined;
}

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

          // Only flag: one side is object, other side is primitive
          // Don't flag: both objects (transpiler uses _hid comparison)
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
          if (
            isStrictEquality &&
            leftClass === 'object' &&
            rightClass === 'object'
          ) {
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
