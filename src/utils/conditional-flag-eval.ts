/**
 * Keep in sync with hosanna-transpiler/src/babel/ConditionalCompilation.ts
 * (evaluateConditionalFlagExpression / containsFlagIdentifier).
 */

export type FlagEvalConfig = {
  buildFlags?: Record<string, boolean>;
  /** When set, used for __ROKU__ if not present in buildFlags (mirrors hsconfig platform). */
  platform?: string;
};

export type ConditionalEvalResult = {
  canEvaluate: boolean;
  value?: boolean;
  isMixed?: boolean;
  isFlagExpression?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyExpr = any;

function getFlagValue(id: { name?: string }, config: FlagEvalConfig): { isFlag: boolean; value?: boolean } {
  const name = id.name || '';
  if (!(name.length > 4 && name.startsWith('__') && name.endsWith('__'))) {
    return { isFlag: false };
  }
  const key = name.slice(2, -2);
  const flags = config.buildFlags;
  if (flags && Object.prototype.hasOwnProperty.call(flags, key)) {
    return { isFlag: true, value: flags[key] };
  }
  if (key === 'ROKU') {
    return { isFlag: true, value: config.platform === 'roku' };
  }
  if (key === 'PROD') {
    const dev = flags?.DEV;
    if (typeof dev === 'boolean') {
      return { isFlag: true, value: !dev };
    }
  }
  return { isFlag: true };
}

function _eval(node: AnyExpr, config: FlagEvalConfig): ConditionalEvalResult {
  if (!node || typeof node !== 'object') {
    return { canEvaluate: false, isMixed: true, isFlagExpression: false };
  }
  if (node.type === 'Literal' && typeof node.value === 'boolean') {
    return { canEvaluate: true, value: node.value, isFlagExpression: false };
  }
  if (node.type === 'ParenthesizedExpression' && node.expression) {
    return _eval(node.expression, config);
  }
  if (node.type === 'Identifier') {
    const flagInfo = getFlagValue(node, config);
    if (flagInfo.isFlag) {
      if (typeof flagInfo.value === 'boolean') {
        return { canEvaluate: true, value: flagInfo.value, isFlagExpression: true };
      }
      return { canEvaluate: false, isFlagExpression: true };
    }
    return { canEvaluate: false, isMixed: true, isFlagExpression: false };
  }
  if (node.type === 'UnaryExpression' && node.operator === '!') {
    const inner = _eval(node.argument, config);
    if (inner.canEvaluate && typeof inner.value === 'boolean') {
      return { canEvaluate: true, value: !inner.value, isFlagExpression: inner.isFlagExpression };
    }
    return {
      canEvaluate: false,
      isMixed: inner.isMixed ?? false,
      isFlagExpression: inner.isFlagExpression ?? false,
    };
  }
  if (node.type === 'LogicalExpression' && (node.operator === '&&' || node.operator === '||')) {
    const left = _eval(node.left, config);
    const right = _eval(node.right, config);
    const mixed = left.isMixed || right.isMixed ? true : false;
    if (left.canEvaluate && right.canEvaluate) {
      if (node.operator === '&&') {
        return {
          canEvaluate: true,
          value: Boolean(left.value && right.value),
          isFlagExpression: Boolean(left.isFlagExpression || right.isFlagExpression),
        };
      }
      return {
        canEvaluate: true,
        value: Boolean(left.value || right.value),
        isFlagExpression: Boolean(left.isFlagExpression || right.isFlagExpression),
      };
    }
    return {
      canEvaluate: false,
      isMixed: mixed || (!left.canEvaluate && !right.canEvaluate),
      isFlagExpression: Boolean(left.isFlagExpression || right.isFlagExpression),
    };
  }

  return { canEvaluate: false, isMixed: true, isFlagExpression: false };
}

export function evaluateConditionalFlagExpression(node: AnyExpr, config: FlagEvalConfig): ConditionalEvalResult {
  return _eval(node, config);
}

export function containsFlagIdentifier(node: AnyExpr): boolean {
  return _scan(node);

  function _scan(n: AnyExpr): boolean {
    if (!n || typeof n !== 'object') return false;
    if (n.type === 'Identifier') {
      const name = n.name || '';
      return name.length > 4 && name.startsWith('__') && name.endsWith('__');
    }
    if (n.type === 'Literal' && typeof n.value === 'boolean') {
      return false;
    }
    if (n.type === 'ParenthesizedExpression' && n.expression) {
      return _scan(n.expression);
    }
    if (n.type === 'UnaryExpression' && n.operator === '!') {
      return _scan(n.argument);
    }
    if (n.type === 'LogicalExpression') {
      return _scan(n.left) || _scan(n.right);
    }
    return false;
  }
}
