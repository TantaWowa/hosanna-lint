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
