import { Rule } from 'eslint';

/**
 * Mapping from ESLint rule names to HS diagnostic codes.
 * Mirrors the transpiler's eslintMappings.ts plus the new rules.
 */
const RULE_TO_HS_CODES: Record<string, string[]> = {
  'no-async-function-pointer-invalid-reference': ['hs-1094'],
  'no-this-in-non-arrow-closure': ['hs-1098'],
  'no-json-imports': ['hs-1061'],
  'no-await-expression': ['hs-1032'],
  'no-nested-functions': ['hs-1035'],
  'no-inline-classes': ['hs-1062'],
  'computed-property-in-object-literal': ['hs-1031'],
  'no-date-usage': ['hs-1082'],
  'no-reserved-words': ['hs-1027'],
  'no-unsupported-array-methods': ['hs-1047', 'hs-1110'],
  'no-unsupported-string-methods': ['hs-1048', 'hs-1109'],
  'no-epsilon-usage': ['hs-1065'],
  'no-nan-usage': ['hs-1022'],
  'no-number-isnan': ['hs-1066'],
  'no-non-null-on-call-expression': ['hs-1072'],
  'no-isnan-emulated': ['hs-1067'],
  'no-large-numeric-literals': ['hs-1075'],
  'no-function-expression-on-anonymous-object': ['hs-1024'],
  'no-iife-usage': ['hs-1030'],
  'no-ts-module-declarations': ['hs-1018', 'hs-1017'],
  'no-function-reference-outside-module': ['hs-1025'],
  'no-closure-variable-modification': ['hs-1023'],
  'no-closure-captures-variable-before-assignment': ['hs-1116'],
  'no-native-function-closure-or-variadic-invocation': ['hs-1115'],
  'no-export-aliasing': ['hs-1012'],
  'no-unary-on-illegal-type': ['hs-1070'],
  'no-union-expression-in-non-statement': ['hs-1013'],
  'no-call-on-anonymous-function': ['hs-1029'],
  'no-unsupported-regex-flags': ['hs-1095'],
  'promise-static-polyfilled': ['hs-1100'],
  'no-unsupported-promise-methods': ['hs-1101', 'hs-1102'],
  'no-unsafe-number-parsing': ['hs-1105'],
  'no-json-stringify-space': ['hs-1097'],

  // New rules from transpiler diagnostics
  'no-infinity-usage': ['hs-1038'],
  'no-too-many-if-else': ['hs-1002'],
  'no-too-many-switch-cases': ['hs-1003'],
  'no-logical-expression-limit': ['hs-1036'],
  'no-too-many-nots': ['hs-1060'],
  'no-unsupported-compound-assignment': ['hs-1039'],
  'no-object-prototype': ['hs-1077'],
  'no-buffer-api': ['hs-1085'],
  'no-crypto-api': ['hs-1086'],
  'no-json-stringify-replacer': ['hs-1096'],
  'no-unsupported-object-methods': ['hs-1050', 'hs-1051'],
  'no-unsupported-math-methods': ['hs-1108'],
  'no-unsupported-number-static-methods': ['hs-1064'],
  'no-interface-computed-property': ['hs-1080'],
  'no-argument-binding': ['hs-1071'],
  'no-for-in-on-array': ['hs-1033'],
  'no-unsupported-json-functions': ['hs-1045'],
  'no-find-node-method': ['hs-1076'],
  'no-unsupported-destructuring-context': ['hs-1040', 'hs-1041'],
  'no-for-of-on-non-array': ['hs-1014'],
  'no-basic-type-binary-comparison': ['hs-1019'],
  'no-function-typed-as-any': ['hs-1034'],
  'no-suboptimal-array-access': ['hs-1042', 'hs-1042_1', 'hs-1043', 'hs-1044'],
  'no-string-method-on-non-string': ['hs-1106'],
  'no-number-method-on-non-number': ['hs-1107'],
  'no-static-member-access-with-this': ['hs-1056'],
  'no-typeof-brs-node-method': ['hs-1103'],
  'no-comparison-brs-node-method': ['hs-1104'],
  'no-sgnode-equality-unsafe': ['hs-1114'],
  'no-recursion-in-logical-expression': ['hs-1037'],
  'no-ternary-iife-slow-path': ['hs-1112'],
  'no-nullish-coalescing-iife-slow-path': ['hs-1113'],
  'no-case-insensitive-class-collision': ['hs-1020'],
  'no-duplicate-class-name': ['hs-1063'],
  'no-getter-setter-mismatch': ['hs-1057'],
  'no-vague-state-field-usage': ['hs-1073'],
  'no-vague-computed-access': ['hs-1081'],
};

// Reverse mapping: HS code → set of ESLint rule names (for resolving tokens)
const HS_CODE_TO_RULES: Record<string, string[]> = {};
for (const [rule, codes] of Object.entries(RULE_TO_HS_CODES)) {
  for (const code of codes) {
    if (!HS_CODE_TO_RULES[code]) HS_CODE_TO_RULES[code] = [];
    HS_CODE_TO_RULES[code].push(rule);
  }
}

interface ParsedDisableDirectives {
  /** Line-level disables: maps 1-based line number → set of suppressed codes (lowercase) */
  lineDisables: Map<number, Set<string>>;
  /** File-level disables: set of suppressed codes (lowercase) for the whole file */
  fileDisables: Set<string>;
}

/**
 * Parse all hs:disable directives from comments in a source file.
 * Cached per filename to avoid re-parsing on every report call.
 */
const directiveCache = new WeakMap<object, ParsedDisableDirectives>();

function parseDirectives(sourceCode: Rule.RuleContext['sourceCode']): ParsedDisableDirectives {
  const cached = directiveCache.get(sourceCode);
  if (cached) return cached;

  const lineDisables = new Map<number, Set<string>>();
  const fileDisables = new Set<string>();

  const comments = sourceCode.getAllComments();
  for (const comment of comments) {
    const text = comment.value.trim();
    const lower = text.toLowerCase();

    // hs:disable-next-line [CODE1, CODE2, ...]
    const nextLineMatch = lower.match(/hs:\s*disable-next-line\s*(.*)/);
    if (nextLineMatch) {
      const targetLine = (comment.loc?.end.line ?? 0) + 1;
      const codesStr = nextLineMatch[1].trim();
      const codes = codesStr
        ? codesStr.split(/[\s,]+/).map(c => c.trim().toLowerCase()).filter(Boolean)
        : ['*'];

      if (!lineDisables.has(targetLine)) lineDisables.set(targetLine, new Set());
      const set = lineDisables.get(targetLine)!;
      for (const code of codes) set.add(code);
      continue;
    }

    // hs:ignore (suppress everything on next line)
    if (lower.match(/hs:\s*ignore/)) {
      const targetLine = (comment.loc?.end.line ?? 0) + 1;
      if (!lineDisables.has(targetLine)) lineDisables.set(targetLine, new Set());
      lineDisables.get(targetLine)!.add('*');
      continue;
    }

    // /* hs:disable CODE1, CODE2, ... */ (file-level block disable)
    const blockMatch = lower.match(/hs:\s*disable\s+([\s\S]*)/);
    if (blockMatch && comment.type === 'Block') {
      const codes = blockMatch[1].split(/[\s,]+/).map(c => c.trim().toLowerCase()).filter(Boolean);
      for (const code of codes) fileDisables.add(code);
    }
  }

  const result = { lineDisables, fileDisables };
  directiveCache.set(sourceCode, result);
  return result;
}

/**
 * Check if a diagnostic at a given node should be suppressed by hs:disable directives.
 */
function isDisabledByHsDirective(
  sourceCode: Rule.RuleContext['sourceCode'],
  node: Rule.Node | undefined,
  ruleName: string
): boolean {
  if (!node?.loc) return false;

  const { lineDisables, fileDisables } = parseDirectives(sourceCode);
  const nodeLine = node.loc.start.line;

  const hsCodes = RULE_TO_HS_CODES[ruleName] ?? [];
  const allTokens = [ruleName, ...hsCodes];

  // Check file-level disables
  if (fileDisables.size > 0) {
    if (fileDisables.has('*')) return true;
    for (const token of allTokens) {
      if (fileDisables.has(token)) return true;
    }
  }

  // Check line-level disables (exact line the node starts on)
  const lineSet = lineDisables.get(nodeLine);
  if (lineSet) {
    if (lineSet.has('*')) return true;
    for (const token of allTokens) {
      if (lineSet.has(token)) return true;
    }
  }

  return false;
}

/**
 * Wrap an ESLint rule so that context.report() automatically checks
 * for hs:disable-next-line and hs:disable block directives before reporting.
 *
 * ESLint 9.x freezes the context object, so we use Object.create to make
 * an unfrozen delegate that inherits all properties from the frozen context
 * but allows overriding report().
 */
export function wrapRuleWithHsDisable(rule: Rule.RuleModule, ruleName: string): Rule.RuleModule {
  return {
    ...rule,
    create(context: Rule.RuleContext) {
      const originalReport = context.report.bind(context);

      // Create an unfrozen delegate; property reads fall through to the frozen context.
      // We must use defineProperty because the prototype's `report` is non-writable,
      // which prevents simple assignment even on derived objects in strict mode.
      const delegate = Object.create(context) as Rule.RuleContext;
      Object.defineProperty(delegate, 'report', {
        value: function (descriptor: Parameters<Rule.RuleContext['report']>[0]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const node = (descriptor as any).node as Rule.Node | undefined;
          if (node && isDisabledByHsDirective(context.sourceCode, node, ruleName)) {
            return;
          }
          return originalReport(descriptor);
        },
        writable: true,
        configurable: true,
        enumerable: true,
      });

      return rule.create(delegate);
    },
  };
}
