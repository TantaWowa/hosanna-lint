import { Rule, Scope } from 'eslint';
import {
  SUPPORTED_ARRAY_INSTANCE_METHODS,
  SUPPORTED_ARRAY_STATIC_METHODS,
} from '@tantawowa/hosanna-supported-apis';

const SUPPORTED_ARRAY_STATIC = new Set<string>(SUPPORTED_ARRAY_STATIC_METHODS);
const SUPPORTED_ARRAY_INSTANCE = new Set<string>(SUPPORTED_ARRAY_INSTANCE_METHODS);

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'HS-1047/1110: Disallow unsupported Array methods in Hosanna/BrightScript. Only methods polyfilled by the transpiler are allowed.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      unsupportedArrayStaticMethod: 'HS-1047: Array static method "{{method}}" is not supported in Hosanna/BrightScript.',
      unsupportedArrayInstanceMethod: 'HS-1110: Array instance method "{{method}}" is not supported in Hosanna/BrightScript.',
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
          node.callee.object.name === 'Array' &&
          !SUPPORTED_ARRAY_STATIC.has(methodName)
        ) {
          context.report({
            node: node.callee.property,
            messageId: 'unsupportedArrayStaticMethod',
            data: { method: methodName },
          });
          return;
        }

        if (!SUPPORTED_ARRAY_INSTANCE.has(methodName)) {
          if (isLikelyArray(node.callee.object, context)) {
            context.report({
              node: node.callee.property,
              messageId: 'unsupportedArrayInstanceMethod',
              data: { method: methodName },
            });
          }
        }
      },
    };
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isLikelyArray(node: any, context: Rule.RuleContext): boolean {
  if (node.type === 'ArrayExpression') {
    return true;
  }

  if (node.type === 'Identifier') {
    const scope = context.sourceCode.getScope(node);
    const variable = scope.variables.find((v: Scope.Variable) => v.name === node.name);
    if (variable && variable.defs.length > 0) {
      const def = variable.defs[0];
      if (def.node.type === 'VariableDeclarator' && def.node.id.typeAnnotation) {
        if (isArrayTypeAnnotation(def.node.id.typeAnnotation)) {
          return true;
        }
      }
      if (def.node.type === 'VariableDeclarator' && def.node.init && def.node.init.type === 'ArrayExpression') {
        return true;
      }
    }
  }

  if (node.type === 'MemberExpression' && node.computed === true) {
    return isLikelyArray(node.object, context);
  }

  return false;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isArrayTypeAnnotation(typeAnnotation: any): boolean {
  if (!typeAnnotation || !typeAnnotation.typeAnnotation) {
    return false;
  }

  const type = typeAnnotation.typeAnnotation;
  return type.type === 'TSArrayType' ||
         (type.type === 'TSTypeReference' &&
          type.typeName.type === 'Identifier' &&
          type.typeName.name === 'Array');
}

export default rule;
