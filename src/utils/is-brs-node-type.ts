import * as ts from 'typescript';

/** Matches transpiler / `no-sgnode-equality-unsafe`: SG or BRS-facing node interface types. */
const BRS_NODE_INTERFACES = new Set(['ISGROSGNode', 'IBrsNode', 'ISGNNode']);

export function isBrsNodeType(type: ts.Type): boolean {
  const symbol = type.getSymbol();
  if (symbol && BRS_NODE_INTERFACES.has(symbol.name)) return true;

  if (type.isUnion()) {
    return type.types.some((t) => isBrsNodeType(t));
  }

  const baseTypes = type.getBaseTypes?.();
  if (baseTypes) {
    return baseTypes.some((t) => isBrsNodeType(t));
  }

  return false;
}
