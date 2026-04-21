import * as ts from 'typescript';

/**
 * Mirrors hosanna-transpiler `classifyForInRhs` / `TypeUtils` for ESLint parity
 * (HS-1122 / HS-1123).
 */
export type ForInRhsLintClass = 'plain' | 'sgnode' | 'unsupported';

function isSceneGraphNodeTypeLabel(name: string): boolean {
  return /ISG\w*Node|ISGN\w+|IBrsNode|ISGROSGNode|roSGNode/i.test(name);
}

function isStrictBooleanType(type: ts.Type | undefined): boolean {
  return !!type && ((type.flags & ts.TypeFlags.Boolean) !== 0 || (type.flags & ts.TypeFlags.BooleanLiteral) !== 0);
}

function classifyForInRhsType(checker: ts.TypeChecker, type: ts.Type): ForInRhsLintClass {
  if (type.flags & ts.TypeFlags.Any || type.flags & ts.TypeFlags.Unknown) {
    return 'unsupported';
  }

  if (type.isUnion()) {
    const ut = type as ts.UnionType;
    const nonNullish = ut.types.filter(
      t => (t.flags & ts.TypeFlags.Undefined) === 0 && (t.flags & ts.TypeFlags.Null) === 0
    );
    if (nonNullish.length === 0) {
      return 'unsupported';
    }
    const parts = nonNullish.map(t => classifyForInRhsType(checker, t));
    if (parts.some(p => p === 'unsupported')) {
      return 'unsupported';
    }
    if (parts.some(p => p === 'sgnode')) {
      return 'sgnode';
    }
    return 'plain';
  }

  if (isStrictBooleanType(type)) {
    return 'unsupported';
  }
  if (type.flags & ts.TypeFlags.NumberLike || type.flags & ts.TypeFlags.BigIntLike) {
    return 'unsupported';
  }
  if (type.flags & ts.TypeFlags.ESSymbolLike) {
    return 'unsupported';
  }

  if (type.flags & ts.TypeFlags.StringLike) {
    return 'plain';
  }

  const sym = type.getSymbol();
  const symName = sym?.name ?? '';
  const typeStr = checker.typeToString(type);
  if (isSceneGraphNodeTypeLabel(symName) || isSceneGraphNodeTypeLabel(typeStr)) {
    return 'sgnode';
  }

  if (type.flags & ts.TypeFlags.Object) {
    return 'plain';
  }

  return 'unsupported';
}

/** Matches transpiler IteratorType for the RHS of for-in (simplified). */
function getIteratorCategoryFromType(checker: ts.TypeChecker, type: ts.Type): 'array' | 'map' | 'set' | 'otherIterable' | 'none' {
  const t = checker.getNonNullableType(type);
  if ((t.flags & ts.TypeFlags.Any) !== 0 || (t.flags & ts.TypeFlags.Unknown) !== 0) {
    return 'none';
  }
  if (checker.isArrayLikeType(t)) {
    return 'array';
  }
  const sym = (t as ts.TypeReference).symbol?.name ?? t.getSymbol()?.name;
  if (sym === 'Map') {
    return 'map';
  }
  if (sym === 'Set') {
    return 'set';
  }
  if (sym) {
    return 'otherIterable';
  }
  return 'none';
}

/**
 * `array` → let `no-for-in-on-array` (HS-1033) handle; these rules skip.
 */
export function lintClassifyForInRhs(checker: ts.TypeChecker, type: ts.Type): ForInRhsLintClass | 'array' {
  const nonNull = checker.getNonNullableType(type);
  const isAny = (nonNull.flags & ts.TypeFlags.Any) !== 0;
  const isUnknown = (nonNull.flags & ts.TypeFlags.Unknown) !== 0;

  if (!isAny && !isUnknown && checker.isArrayLikeType(nonNull)) {
    return 'array';
  }

  const iteratorType = getIteratorCategoryFromType(checker, nonNull);
  if (iteratorType === 'map' || iteratorType === 'set') {
    return 'unsupported';
  }

  const detailed = classifyForInRhsType(checker, nonNull);
  if (detailed === 'sgnode') {
    return 'sgnode';
  }

  if (iteratorType === 'otherIterable') {
    if (detailed === 'plain') {
      return 'plain';
    }
    return 'unsupported';
  }

  return detailed;
}
