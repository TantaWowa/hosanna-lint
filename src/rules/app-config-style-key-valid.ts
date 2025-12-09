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
 * Validate a string path exists in app.config.json
 */
function validatePath(pathStr: string, context: Rule.RuleContext, node: Rule.Node): void {
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
          const stringLiterals = extractStringLiterals(node.value);
          for (const literal of stringLiterals) {
            validatePath(literal, context, node.value as Rule.Node);
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
          const stringLiterals = extractStringLiterals(node.right);
          for (const literal of stringLiterals) {
            validatePath(literal, context, node.right as Rule.Node);
          }
        }
      },
    };
  },
};

export default rule;

