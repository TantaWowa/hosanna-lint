import { Rule, Scope } from 'eslint';

const UNSUPPORTED_STRING_STATIC_METHODS = new Set([
  'fromCharCode',
  'fromCodePoint',
  'raw',
]);

const SUPPORTED_STRING_INSTANCE_METHODS = new Set([
  'toUpperCase', 'toLowerCase', 'toLocaleLowerCase', 'toLocaleUpperCase',
  'charAt', 'charCodeAt', 'indexOf', 'split', 'trim', 'startsWith',
  'endsWith', 'padStart', 'padEnd', 'repeat', 'includes', 'lastIndexOf',
  'trimStart', 'trimEnd', 'substring', 'slice', 'concat', 'match',
  'matchAll', 'replace', 'replaceAll', 'toString', 'substr', 'length',
  'at', 'search', 'valueOf',
]);

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'HS-1048/1109: Disallow unsupported String static and instance methods in Hosanna/BrightScript.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      unsupportedStringMethod: 'HS-1048: String static method "{{method}}" is not supported in Hosanna/BrightScript.',
      unsupportedStringInstanceMethod: 'HS-1109: String instance method "{{method}}" is not supported in Hosanna/BrightScript.',
    },
  },
  create: function (context) {
    return {
      CallExpression: function (node) {
        if (
          node.callee.type !== 'MemberExpression' ||
          node.callee.property.type !== 'Identifier'
        ) {
          return;
        }

        const methodName = node.callee.property.name;

        if (
          node.callee.object.type === 'Identifier' &&
          node.callee.object.name === 'String'
        ) {
          if (UNSUPPORTED_STRING_STATIC_METHODS.has(methodName)) {
            context.report({
              node: node.callee.property,
              messageId: 'unsupportedStringMethod',
              data: { method: methodName },
            });
          }
          return;
        }

        if (!SUPPORTED_STRING_INSTANCE_METHODS.has(methodName)) {
          if (isLikelyString(node.callee.object, context)) {
            context.report({
              node: node.callee.property,
              messageId: 'unsupportedStringInstanceMethod',
              data: { method: methodName },
            });
          }
        }
      },
    };
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isLikelyString(node: any, context: Rule.RuleContext): boolean {
  if (node.type === 'Literal' && typeof node.value === 'string') {
    return true;
  }
  if (node.type === 'TemplateLiteral') {
    return true;
  }
  if (node.type === 'Identifier') {
    const scope = context.sourceCode.getScope(node);
    const variable = scope.variables.find((v: Scope.Variable) => v.name === node.name);
    if (variable && variable.defs.length > 0) {
      const def = variable.defs[0];
      if (def.node.type === 'VariableDeclarator' && def.node.id.typeAnnotation) {
        if (isStringTypeAnnotation(def.node.id.typeAnnotation)) {
          return true;
        }
      }
      if (
        def.node.type === 'VariableDeclarator' &&
        def.node.init &&
        (
          (def.node.init.type === 'Literal' && typeof def.node.init.value === 'string') ||
          def.node.init.type === 'TemplateLiteral'
        )
      ) {
        return true;
      }
    }
  }
  return false;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isStringTypeAnnotation(typeAnnotation: any): boolean {
  if (!typeAnnotation || !typeAnnotation.typeAnnotation) {
    return false;
  }
  const type = typeAnnotation.typeAnnotation;
  return type.type === 'TSStringKeyword';
}

export default rule;
