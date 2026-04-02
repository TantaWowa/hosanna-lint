import ts from 'typescript';
import type { Rule } from 'eslint';

function getDeclaredMemberNameFromMemberLike(member: {
  computed: boolean;
  property: Rule.Node;
}): string | undefined {
  if (!member.computed && member.property.type === 'Identifier') {
    return (member.property as unknown as { name: string }).name;
  }
  if (member.computed && member.property.type === 'Literal' && typeof (member.property as { value?: unknown }).value === 'string') {
    return (member.property as { value: string }).value;
  }
  return undefined;
}

/**
 * Mirrors transpiler TypeUtils.shouldDiagnoseUndeclaredMemberWriteOnCallableReference (HS-1121).
 */
export function shouldReportUndeclaredMemberWriteOnCallableReference(
  checker: ts.TypeChecker,
  objectType: ts.Type,
  member: { computed: boolean; property: Rule.Node }
): boolean {
  if (objectType.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) return false;
  const apparent = checker.getApparentType(objectType);
  const propName = getDeclaredMemberNameFromMemberLike(member);
  if (propName !== undefined && apparent.getProperty(propName)) return false;

  const callSigs = apparent.getCallSignatures();
  const constructSigs = apparent.getConstructSignatures();

  if (constructSigs.length > 0 && callSigs.length === 0) {
    const sym = apparent.getSymbol();
    if (sym && sym.flags & ts.SymbolFlags.Class) {
      return false;
    }
    return true;
  }

  if (callSigs.length > 0 && constructSigs.length === 0) {
    const sym = apparent.getSymbol();
    if (sym && sym.flags & ts.SymbolFlags.Class) {
      return false;
    }
    return true;
  }

  return false;
}
