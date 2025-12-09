import { Rule } from 'eslint';
import * as fs from 'fs';
import * as path from 'path';
import { jsonPathExists } from '../utils/app-config-loader';

interface Cache {
  fileExistence: Map<string, boolean>;
}

// Cache per ESLint context for file existence checks
const cacheMap = new WeakMap<Rule.RuleContext, Cache>();

/**
 * Get or create cache for the given context
 */
function getCache(context: Rule.RuleContext): Cache {
  let cache = cacheMap.get(context);
  if (!cache) {
    cache = {
      fileExistence: new Map(),
    };
    cacheMap.set(context, cache);
  }
  return cache;
}

/**
 * Validate pkg:/ path exists in assets folder
 */
function validatePkgPath(
  pkgPath: string,
  context: Rule.RuleContext,
  _jsonPath: string
): { valid: boolean; error?: string } {
  if (!pkgPath.startsWith('pkg:/')) {
    return { valid: true }; // Not a pkg path, skip
  }

  // Extract path after pkg:/assets/
  const match = pkgPath.match(/^pkg:\/assets\/(.+)$/);
  if (!match) {
    return {
      valid: false,
      error: `Invalid pkg:/ path format. Expected pkg:/assets/... but got: ${pkgPath}`,
    };
  }

  const relativePath = match[1];
  const cache = getCache(context);

  // Resolve @res to -fhd for file system checks
  const resolvedPath = relativePath.replace('@res', '-fhd');
  const cacheKey = `pkg:${relativePath}`;

  // Check cache first
  if (cache.fileExistence.has(cacheKey)) {
    const exists = cache.fileExistence.get(cacheKey);
    if (!exists) {
      return {
        valid: false,
        error: `File not found: pkg:/assets/${relativePath} (checked at ${path.join(context.getCwd(), 'assets', resolvedPath)})`,
      };
    }
    return { valid: true };
  }

  // Check file existence using resolved path
  const projectRoot = context.getCwd();
  const fullPath = path.join(projectRoot, 'assets', resolvedPath);

  let exists = false;
  try {
    exists = fs.existsSync(fullPath);
  } catch (error) {
    return {
      valid: false,
      error: `Error checking file existence: ${error}`,
    };
  }

  // Cache the result
  cache.fileExistence.set(cacheKey, exists);

  if (!exists) {
    return {
      valid: false,
      error: `File not found: pkg:/assets/${relativePath} (checked at ${fullPath})`,
    };
  }

  return { valid: true };
}

/**
 * Validate JSON reference (~path.to.json)
 */
function validateJsonReference(
  ref: string,
  jsonObj: any,
  jsonPath: string
): { valid: boolean; error?: string } {
  if (!ref.startsWith('~')) {
    return { valid: true }; // Not a reference, skip
  }

  const pathStr = ref.substring(1); // Remove ~ prefix
  if (!jsonPathExists(jsonObj, pathStr)) {
    return {
      valid: false,
      error: `JSON reference not found: ~${pathStr} (at ${jsonPath})`,
    };
  }

  return { valid: true };
}

/**
 * Validate $extends reference
 */
function validateExtendsReference(
  extendsPath: string,
  jsonObj: any,
  jsonPath: string
): { valid: boolean; error?: string } {
  if (!jsonPathExists(jsonObj, extendsPath)) {
    return {
      valid: false,
      error: `$extends reference not found: ${extendsPath} (at ${jsonPath})`,
    };
  }

  return { valid: true };
}

/**
 * Traverse JSON object and collect all pkg:/ paths, ~ references, and $extends
 */
interface TraversalResult {
  pkgPaths: Array<{ path: string; jsonPath: string; value: string }>;
  jsonRefs: Array<{ ref: string; jsonPath: string; value: string }>;
  extendsRefs: Array<{ path: string; jsonPath: string; value: string }>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function traverseJson(obj: any, currentPath: string = ''): TraversalResult {
  const result: TraversalResult = {
    pkgPaths: [],
    jsonRefs: [],
    extendsRefs: [],
  };

  if (obj === null || obj === undefined) {
    return result;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const itemPath = currentPath ? `${currentPath}[${index}]` : `[${index}]`;
      const itemResult = traverseJson(item, itemPath);
      result.pkgPaths.push(...itemResult.pkgPaths);
      result.jsonRefs.push(...itemResult.jsonRefs);
      result.extendsRefs.push(...itemResult.extendsRefs);
    });
    return result;
  }

  if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      const newPath = currentPath ? `${currentPath}.${key}` : key;

      // Check for $extends
      if (key === '$extends' && typeof value === 'string') {
        result.extendsRefs.push({
          path: value,
          jsonPath: newPath,
          value: value,
        });
      }

      // Check if value is a string
      if (typeof value === 'string') {
        // Check for pkg:/ paths
        if (value.includes('pkg:/')) {
          // Extract pkg:/ paths from the string (may contain other text like font sizes)
          const pkgMatch = value.match(/pkg:\/assets\/[^\s,]+/);
          if (pkgMatch) {
            result.pkgPaths.push({
              path: pkgMatch[0],
              jsonPath: newPath,
              value: value,
            });
          }
        }

        // Check for ~ references
        if (value.startsWith('~')) {
          result.jsonRefs.push({
            ref: value,
            jsonPath: newPath,
            value: value,
          });
        }
      } else {
        // Recursively traverse nested objects/arrays
        const nestedResult = traverseJson(value, newPath);
        result.pkgPaths.push(...nestedResult.pkgPaths);
        result.jsonRefs.push(...nestedResult.jsonRefs);
        result.extendsRefs.push(...nestedResult.extendsRefs);
      }
    }
  }

  return result;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Validate app.config.json structure, file paths, and JSON references',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      missingSection: 'Missing required section: {{section}}',
      missingTranslationEn: 'translations section must contain at least "en" key',
      missingThemeColors: 'theme section must contain "colors" object',
      missingThemeFonts: 'theme section must contain "fonts" object',
      invalidPkgPath: '{{error}}',
      invalidJsonReference: '{{error}}',
      invalidExtendsReference: '{{error}}',
      jsonParseError: 'Failed to parse JSON: {{error}}',
    },
  },
  create: function (context) {
    // Only process app.config.json files
    const filename = context.filename || '';
    if (!filename.includes('assets/meta/app.config.json') && !filename.endsWith('app.config.json')) {
      return {};
    }

    return {
      Program: function (node) {
        const sourceCode = context.sourceCode;
        const text = sourceCode.text;

        // Parse JSON
        let jsonObj: any;
        try {
          jsonObj = JSON.parse(text);
        } catch (error: any) {
          context.report({
            node,
            messageId: 'jsonParseError',
            data: {
              error: error.message || String(error),
            },
          });
          return;
        }

        // Validate required sections
        if (!jsonObj.rows || typeof jsonObj.rows !== 'object') {
          context.report({
            node,
            messageId: 'missingSection',
            data: { section: 'rows' },
          });
        }

        if (!jsonObj.translations || typeof jsonObj.translations !== 'object') {
          context.report({
            node,
            messageId: 'missingSection',
            data: { section: 'translations' },
          });
        } else if (!jsonObj.translations.en) {
          context.report({
            node,
            messageId: 'missingTranslationEn',
          });
        }

        if (!jsonObj.cells || typeof jsonObj.cells !== 'object') {
          context.report({
            node,
            messageId: 'missingSection',
            data: { section: 'cells' },
          });
        }

        if (!jsonObj.theme || typeof jsonObj.theme !== 'object') {
          context.report({
            node,
            messageId: 'missingSection',
            data: { section: 'theme' },
          });
        } else {
          if (!jsonObj.theme.colors || typeof jsonObj.theme.colors !== 'object') {
            context.report({
              node,
              messageId: 'missingThemeColors',
            });
          }
          if (!jsonObj.theme.fonts || typeof jsonObj.theme.fonts !== 'object') {
            context.report({
              node,
              messageId: 'missingThemeFonts',
            });
          }
        }

        if (!jsonObj.controls || typeof jsonObj.controls !== 'object') {
          context.report({
            node,
            messageId: 'missingSection',
            data: { section: 'controls' },
          });
        }

        // Traverse JSON to find all paths and references
        const traversal = traverseJson(jsonObj);

        // Validate pkg:/ paths
        for (const pkgPath of traversal.pkgPaths) {
          const validation = validatePkgPath(pkgPath.path, context, pkgPath.jsonPath);
          if (!validation.valid) {
            // Find the line/column for this path
            const lines = text.split('\n');
            let line = 1;
            let column = 1;
            const searchText = JSON.stringify(pkgPath.value);
            for (let i = 0; i < lines.length; i++) {
              const index = lines[i].indexOf(searchText);
              if (index !== -1) {
                line = i + 1;
                column = index + 1;
                break;
              }
            }

            context.report({
              node,
              loc: {
                start: { line, column },
                end: { line, column: column + searchText.length },
              },
              messageId: 'invalidPkgPath',
              data: {
                error: validation.error || 'Invalid pkg:/ path',
              },
            });
          }
        }

        // Validate ~ references
        for (const jsonRef of traversal.jsonRefs) {
          const validation = validateJsonReference(jsonRef.ref, jsonObj, jsonRef.jsonPath);
          if (!validation.valid) {
            const lines = text.split('\n');
            let line = 1;
            let column = 1;
            const searchText = JSON.stringify(jsonRef.value);
            for (let i = 0; i < lines.length; i++) {
              const index = lines[i].indexOf(searchText);
              if (index !== -1) {
                line = i + 1;
                column = index + 1;
                break;
              }
            }

            context.report({
              node,
              loc: {
                start: { line, column },
                end: { line, column: column + searchText.length },
              },
              messageId: 'invalidJsonReference',
              data: {
                error: validation.error || 'Invalid JSON reference',
              },
            });
          }
        }

        // Validate $extends references
        for (const extendsRef of traversal.extendsRefs) {
          const validation = validateExtendsReference(extendsRef.path, jsonObj, extendsRef.jsonPath);
          if (!validation.valid) {
            const lines = text.split('\n');
            let line = 1;
            let column = 1;
            const searchText = `"$extends": "${extendsRef.value}"`;
            for (let i = 0; i < lines.length; i++) {
              const index = lines[i].indexOf(searchText);
              if (index !== -1) {
                line = i + 1;
                column = index + 1;
                break;
              }
            }

            context.report({
              node,
              loc: {
                start: { line, column },
                end: { line, column: column + searchText.length },
              },
              messageId: 'invalidExtendsReference',
              data: {
                error: validation.error || 'Invalid $extends reference',
              },
            });
          }
        }
      },
    };
  },
};

export default rule;

