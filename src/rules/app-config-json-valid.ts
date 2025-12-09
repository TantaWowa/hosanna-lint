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
 * Valid Roku system font names (without "SystemFont" suffix, which is substituted automatically)
 */
const VALID_ROKU_SYSTEM_FONTS = new Set([
  'Tiny',
  'TinyBold',
  'Smaller',
  'SmallerBold',
  'Smallest',
  'SmallestBold',
  'Small',
  'SmallBold',
  'Medium',
  'MediumBold',
  'Large',
  'LargeBold',
  'Largest',
  'ExtraLarge',
  'ExtraLargeBold',
  'Badge',
]);

/**
 * Validate font key format (FILE,size or SystemFontName,size)
 */
function validateFontKeyFormat(value: string): { valid: boolean; error?: string } {
  // Must contain exactly one comma
  const commaCount = (value.match(/,/g) || []).length;
  if (commaCount !== 1) {
    return {
      valid: false,
      error: `Font key format must be "FILE,size" or "SystemFontName,size" (found ${commaCount} commas)`,
    };
  }

  const [fontPart, sizePart] = value.split(',');

  // Validate size is a positive integer
  const size = parseInt(sizePart.trim(), 10);
  if (isNaN(size) || size <= 0 || sizePart.trim() !== size.toString()) {
    return {
      valid: false,
      error: `Font size must be a positive integer, got: ${sizePart.trim()}`,
    };
  }

  // Validate font part: either pkg:/assets/fonts/... path OR valid Roku system font name
  if (fontPart.includes('pkg:/')) {
    // If it's a pkg path, validate it starts with pkg:/assets/fonts/
    if (!fontPart.trim().startsWith('pkg:/assets/fonts/')) {
      return {
        valid: false,
        error: `Font file path must start with pkg:/assets/fonts/, got: ${fontPart.trim()}`,
      };
    }
  } else {
    // System font name: must be one of the valid Roku system font names
    const fontName = fontPart.trim();
    if (!VALID_ROKU_SYSTEM_FONTS.has(fontName)) {
      const validNames = Array.from(VALID_ROKU_SYSTEM_FONTS).sort().join(', ');
      return {
        valid: false,
        error: `System font name must be one of: ${validNames}. Got: ${fontName}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Validate JSON reference (~path.to.json)
 */
function validateJsonReference(
  ref: string,
  jsonObj: any,
  jsonPath: string,
  key: string
): { valid: boolean; error?: string } {
  if (!ref.startsWith('~')) {
    return { valid: true }; // Not a reference, skip
  }

  // Check if key is $extends - should not have ~ prefix
  if (key === '$extends') {
    return {
      valid: false,
      error: `$extends values should not start with ~`,
    };
  }

  // Check if key ends with 'Key' (except fontKey) - should not have ~ prefix
  if (key.endsWith('Key') && key !== 'fontKey') {
    return {
      valid: false,
      error: `Keys ending in 'Key' (except fontKey) should not have values starting with ~`,
    };
  }

  // Special handling for fontKey
  if (key === 'fontKey') {
    // If fontKey has ~ prefix, validate the path exists after removing ~
    const pathStr = ref.substring(1); // Remove ~ prefix
    if (!jsonPathExists(jsonObj, pathStr)) {
      return {
        valid: false,
        error: `JSON reference not found: ~${pathStr} (at ${jsonPath})`,
      };
    }
    return { valid: true };
  }

  // For other keys, validate the path exists after removing ~ prefix
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
  jsonRefs: Array<{ ref: string; jsonPath: string; value: string; key: string }>;
  extendsRefs: Array<{ path: string; jsonPath: string; value: string }>;
  fontKeys: Array<{ value: string; jsonPath: string }>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function traverseJson(obj: any, currentPath: string = ''): TraversalResult {
  const result: TraversalResult = {
    pkgPaths: [],
    jsonRefs: [],
    extendsRefs: [],
    fontKeys: [],
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
      result.fontKeys.push(...itemResult.fontKeys);
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
            key: key,
          });
        }

        // Check for fontKey values without ~ prefix
        if (key === 'fontKey' && !value.startsWith('~')) {
          result.fontKeys.push({
            value: value,
            jsonPath: newPath,
          });
        }
      } else {
        // Recursively traverse nested objects/arrays
        const nestedResult = traverseJson(value, newPath);
        result.pkgPaths.push(...nestedResult.pkgPaths);
        result.jsonRefs.push(...nestedResult.jsonRefs);
        result.extendsRefs.push(...nestedResult.extendsRefs);
        result.fontKeys.push(...nestedResult.fontKeys);
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
      extendsWithTilde: '$extends values should not start with ~',
      keyWithTilde: "Keys ending in 'Key' (except fontKey) should not have values starting with ~",
      invalidFontKeyFormat: '{{error}}',
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
          const validation = validateJsonReference(jsonRef.ref, jsonObj, jsonRef.jsonPath, jsonRef.key);
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

            // Determine message ID based on error type
            let messageId = 'invalidJsonReference';
            if (validation.error?.includes("$extends values should not start with ~")) {
              messageId = 'extendsWithTilde';
            } else if (validation.error?.includes("Keys ending in 'Key'")) {
              messageId = 'keyWithTilde';
            }

            context.report({
              node,
              loc: {
                start: { line, column },
                end: { line, column: column + searchText.length },
              },
              messageId: messageId,
              data: {
                error: validation.error || 'Invalid JSON reference',
              },
            });
          }
        }

        // Validate fontKey values without ~ prefix
        for (const fontKey of traversal.fontKeys) {
          const validation = validateFontKeyFormat(fontKey.value);
          if (!validation.valid) {
            const lines = text.split('\n');
            let line = 1;
            let column = 1;
            const searchText = JSON.stringify(fontKey.value);
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
              messageId: 'invalidFontKeyFormat',
              data: {
                error: validation.error || 'Invalid font key format',
              },
            });
          }
        }

        // Validate $extends references
        for (const extendsRef of traversal.extendsRefs) {
          // Check if $extends value starts with ~ (should not)
          if (extendsRef.path.startsWith('~')) {
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
              messageId: 'extendsWithTilde',
            });
            continue;
          }

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

