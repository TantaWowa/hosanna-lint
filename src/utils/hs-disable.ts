import { Rule } from 'eslint';
import { ESLINT_RULE_TO_HS_CODES_LOWER } from '@tantawowa/hosanna-supported-apis';
import { hasExcludeFromPlatformRokuDirective } from './excludeFromPlatformRoku';

const EXCLUDE_ROKU_IN_COMMENT = /hs:exclude-from-platform\s+roku/i;

/**
 * Mapping from ESLint rule names to HS diagnostic codes (single source: @tantawowa/hosanna-supported-apis).
 */
const RULE_TO_HS_CODES: Record<string, string[]> = Object.fromEntries(
  Object.entries(ESLINT_RULE_TO_HS_CODES_LOWER).map(([rule, codes]) => [rule, [...codes]]),
);

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
const fileExcludedFromRokuCache = new WeakMap<object, boolean>();

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

function isFileExcludedFromRoku(sourceCode: Rule.RuleContext['sourceCode']): boolean {
  let v = fileExcludedFromRokuCache.get(sourceCode);
  if (v !== undefined) return v;
  v = hasExcludeFromPlatformRokuDirective(sourceCode.text);
  fileExcludedFromRokuCache.set(sourceCode, v);
  return v;
}

/**
 * Match BabelProgram.isSkippingNode / transpiler diagnostics: leading comment on this node or any
 * ancestor up to Program can exclude the subtree from Roku (covers export const ... etc.).
 */
function isExcludedFromRokuByLeadingComments(
  sourceCode: Rule.RuleContext['sourceCode'],
  node: Rule.Node | undefined
): boolean {
  let current: Rule.Node | undefined = node;
  while (current) {
    const comments = sourceCode.getCommentsBefore(current);
    for (const c of comments) {
      if (EXCLUDE_ROKU_IN_COMMENT.test(c.value)) return true;
    }
    const withLeading = current as Rule.Node & { leadingComments?: Array<{ value: string }> };
    if (withLeading.leadingComments) {
      for (const c of withLeading.leadingComments) {
        if (EXCLUDE_ROKU_IN_COMMENT.test(c.value)) return true;
      }
    }
    if (current.type === 'Program') break;
    current = current.parent as Rule.Node | undefined;
  }
  return false;
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
          if (isFileExcludedFromRoku(context.sourceCode)) {
            return;
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const node = (descriptor as any).node as Rule.Node | undefined;
          if (node && isExcludedFromRokuByLeadingComments(context.sourceCode, node)) {
            return;
          }
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
