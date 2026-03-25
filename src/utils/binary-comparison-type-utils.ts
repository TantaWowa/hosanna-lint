import * as ts from 'typescript';

export const COMPARISON_OPERATORS = new Set(['===', '!==', '==', '!=']);

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

export function classifyType(type: ts.Type, checker: ts.TypeChecker): 'primitive' | 'nullish' | 'object' {
  if (isNullishOrAny(type)) return 'nullish';
  if (isPrimitive(type)) return 'primitive';

  if (type.flags & ts.TypeFlags.TypeParameter) {
    const constraint = checker.getBaseConstraintOfType(type);
    if (constraint) return classifyType(constraint, checker);
    return 'nullish';
  }

  if (type.flags & ts.TypeFlags.Index) {
    return 'nullish';
  }

  if (type.flags & ts.TypeFlags.IndexedAccess) {
    const constraint = checker.getBaseConstraintOfType(type);
    if (constraint) return classifyType(constraint, checker);
    return 'nullish';
  }

  if (type.flags & ts.TypeFlags.Conditional || type.flags & ts.TypeFlags.Substitution) {
    const constraint = checker.getBaseConstraintOfType(type);
    if (constraint) return classifyType(constraint, checker);
    return 'nullish';
  }

  if (type.isUnion()) {
    const classifications = type.types.map(t => classifyType(t, checker));
    const hasObject = classifications.includes('object');
    const hasPrimitive = classifications.includes('primitive');
    if (hasObject && hasPrimitive) return 'nullish';
    if (hasObject) return 'object';
    if (hasPrimitive) return 'primitive';
    return 'nullish';
  }

  if (type.isIntersection()) {
    for (const t of type.types) {
      const c = classifyType(t, checker);
      if (c === 'primitive') return 'primitive';
    }
    if (type.types.every(t => classifyType(t, checker) === 'nullish')) return 'nullish';
    return 'object';
  }

  if (type.getCallSignatures().length > 0) return 'object';

  return 'object';
}

/**
 * True if the type is an object type or a union that includes at least one object-typed member
 * (e.g. `IFocusable | undefined` or `IFocusable | NextViewFocus | undefined`).
 * Used so HS-1019 matches transpiler behavior when `classifyType` collapses mixed unions to `nullish`.
 */
export function unionContainsObjectType(type: ts.Type, checker: ts.TypeChecker): boolean {
  if (type.isUnion()) {
    return type.types.some((t) => unionContainsObjectType(t, checker));
  }
  return classifyType(type, checker) === 'object';
}

export function isTypeAssignableToChecker(checker: ts.TypeChecker, source: ts.Type, target: ts.Type): boolean {
  const fn = (checker as unknown as { isTypeAssignableTo(s: ts.Type, t: ts.Type): boolean }).isTypeAssignableTo;
  return fn.call(checker, source, target);
}

export function findInterfaceDeclaration(program: ts.Program, interfaceName: string): ts.InterfaceDeclaration | undefined {
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

/**
 * Matches transpiler `typeHasAnyOrUnknown` (TypeUtils): any/unknown, including inside unions (e.g. `string | unknown`).
 */
export function typeHasAnyOrUnknown(type: ts.Type): boolean {
  if (type.flags & ts.TypeFlags.Any) return true;
  if (type.flags & ts.TypeFlags.Unknown) return true;
  if (type.isUnion()) {
    return type.types.some((t) => typeHasAnyOrUnknown(t));
  }
  return false;
}

/** True when the type is only null / undefined / void (possibly a union of those). */
export function isNullishOnlyType(type: ts.Type): boolean {
  if (type.flags & ts.TypeFlags.Undefined) return true;
  if (type.flags & ts.TypeFlags.Null) return true;
  if (type.flags & ts.TypeFlags.Void) return true;
  if (type.isUnion()) {
    return type.types.every((t) => isNullishOnlyType(t));
  }
  return false;
}

/**
 * When true, the transpiler does not emit HS-1019 for this comparison; strict `===`/`!==` use HS-1118 instead.
 * `no-basic-type-binary-comparison` should not report — use `no-any-unknown-equality-unsafe` for `===`/`!==`.
 */
export function shouldDelegateBinaryComparisonFromBasicToAnyUnknown(
  leftType: ts.Type,
  rightType: ts.Type,
  operator: string,
  checker: ts.TypeChecker
): boolean {
  if (!typeHasAnyOrUnknown(leftType) && !typeHasAnyOrUnknown(rightType)) {
    return false;
  }
  if (isNullishOnlyType(leftType) || isNullishOnlyType(rightType)) {
    return true;
  }
  if (operator === '===' || operator === '!==') {
    const leftW = typeHasAnyOrUnknown(leftType);
    const rightW = typeHasAnyOrUnknown(rightType);
    const oneWeakOnePrimitive =
      (leftW && !rightW && classifyType(rightType, checker) === 'primitive') ||
      (rightW && !leftW && classifyType(leftType, checker) === 'primitive');
    if (oneWeakOnePrimitive) {
      return true;
    }
  }
  return true;
}
