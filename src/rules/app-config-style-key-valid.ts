import { Rule } from 'eslint';
import { getAppConfig, jsonPathExists } from '../utils/app-config-loader';

// Style key property names to validate
const STYLE_KEY_PROPERTIES = new Set([
  'styleKey',
  'fontKey',
  'fontStyleKey',
  'settingsKey',
  'cellSettingsKey',
  'loadingCellStyleKey',
]);

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
 * Extract string literals from an expression node
 * Handles: string literals, ternary operators, null coalescing, logical OR
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractStringLiterals(node: any): string[] {
  const literals: string[] = [];

  if (!node) {
    return literals;
  }

  // Direct string literal
  if (node.type === 'Literal' && typeof node.value === 'string') {
    literals.push(node.value);
    return literals;
  }

  // Template literal (template strings)
  if (node.type === 'TemplateLiteral') {
    // For template literals, we can only validate if they're simple (no expressions)
    // For now, skip template literals with expressions
    if (node.expressions && node.expressions.length === 0 && node.quasis && node.quasis.length === 1) {
      const value = node.quasis[0].value.cooked || node.quasis[0].value.raw;
      if (typeof value === 'string') {
        literals.push(value);
      }
    }
    return literals;
  }

  // Ternary operator: condition ? trueValue : falseValue
  if (node.type === 'ConditionalExpression') {
    literals.push(...extractStringLiterals(node.consequent));
    literals.push(...extractStringLiterals(node.alternate));
    return literals;
  }

  // Null coalescing: value ?? defaultValue
  if (node.type === 'LogicalExpression' && node.operator === '??') {
    literals.push(...extractStringLiterals(node.left));
    literals.push(...extractStringLiterals(node.right));
    return literals;
  }

  // Logical OR: value || defaultValue
  if (node.type === 'LogicalExpression' && node.operator === '||') {
    literals.push(...extractStringLiterals(node.left));
    literals.push(...extractStringLiterals(node.right));
    return literals;
  }

  return literals;
}

/**
 * Check if a property name is a style key property
 */
function isStyleKeyProperty(propertyName: string): boolean {
  return STYLE_KEY_PROPERTIES.has(propertyName);
}

/**
 * Check if a fontKey value is a direct font specification (not a JSON path reference)
 * Direct font specifications are:
 * - Font file paths with size: "pkg:/assets/fonts/font.ttf,30"
 * - System font names with size: "LargeBold,24"
 */
function isDirectFontSpecification(value: string): boolean {
  // If it contains a comma, it's likely a direct font specification (font,size)
  if (value.includes(',')) {
    return true;
  }
  // If it starts with pkg:/, it's a direct font file path
  if (value.startsWith('pkg:/')) {
    return true;
  }
  return false;
}

/**
 * Validate a string path exists in app.config.json
 */
function validatePath(
  pathStr: string,
  propertyName: string,
  context: Rule.RuleContext,
  node: Rule.Node
): void {
  // For fontKey, validate direct font specifications
  if (propertyName === 'fontKey' && isDirectFontSpecification(pathStr)) {
    const validation = validateFontKeyFormat(pathStr);
    if (!validation.valid) {
      context.report({
        node,
        messageId: 'invalidFontKeyFormat',
        data: {
          error: validation.error || 'Invalid font key format',
        },
      });
    }
    return;
  }

  const config = getAppConfig(context);
  if (!config) {
    // If app.config.json doesn't exist, skip validation
    return;
  }

  if (!jsonPathExists(config, pathStr)) {
    context.report({
      node,
      messageId: 'invalidStyleKey',
      data: {
        path: pathStr,
      },
    });
  }
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Validate styleKey, fontKey, fontStyleKey, settingsKey, cellSettingsKey, and loadingCellStyleKey properties reference valid paths in app.config.json',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      invalidStyleKey: 'Style key path "{{path}}" does not exist in app.config.json',
      invalidFontKeyFormat: '{{error}}',
    },
  },
  create: function (context) {
    return {
      // Check object literal properties: { styleKey: "path.to.style" }
      Property: function (node) {
        if (
          node.key &&
          node.key.type === 'Identifier' &&
          isStyleKeyProperty(node.key.name) &&
          node.value
        ) {
          const propertyName = node.key.name;
          const stringLiterals = extractStringLiterals(node.value);
          for (const literal of stringLiterals) {
            validatePath(literal, propertyName, context, node.value as Rule.Node);
          }
        }
      },

      // Check assignment expressions: obj.styleKey = "path.to.style"
      AssignmentExpression: function (node) {
        if (
          node.left &&
          node.left.type === 'MemberExpression' &&
          node.left.property &&
          node.left.property.type === 'Identifier' &&
          isStyleKeyProperty(node.left.property.name) &&
          node.right
        ) {
          const propertyName = node.left.property.name;
          const stringLiterals = extractStringLiterals(node.right);
          for (const literal of stringLiterals) {
            validatePath(literal, propertyName, context, node.right as Rule.Node);
          }
        }
      },
    };
  },
};

export default rule;

