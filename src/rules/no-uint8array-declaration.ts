import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Warn against declaring Uint8Array - Uint8Arrays map to roByteArray in native BrightScript. To access roByteArray methods directly, cast.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      uint8ArrayTypeNotSupported: 'Uint8Array maps to roByteArray in native BrightScript. To access roByteArray methods directly, cast.',
    },
  },
  create: function (context) {
    return {
      // Check for Uint8Array type annotations in variable declarations
      VariableDeclarator: function (node) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const declarator = node as any;
        if (declarator.id && declarator.id.typeAnnotation) {
          const typeAnnotation = declarator.id.typeAnnotation.typeAnnotation;
          if (
            typeAnnotation.type === 'TSTypeReference' &&
            typeAnnotation.typeName &&
            typeAnnotation.typeName.type === 'Identifier' &&
            typeAnnotation.typeName.name === 'Uint8Array'
          ) {
            context.report({
              node: declarator.id.typeAnnotation,
              messageId: 'uint8ArrayTypeNotSupported',
            });
          }
        }
      },

      // Check for Uint8Array in function parameter type annotations
      FunctionDeclaration: function (node) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const funcNode = node as any;
        if (funcNode.params) {
          funcNode.params.forEach((param: any) => {
            if (param.typeAnnotation) {
              const typeAnnotation = param.typeAnnotation.typeAnnotation;
              if (
                typeAnnotation.type === 'TSTypeReference' &&
                typeAnnotation.typeName &&
                typeAnnotation.typeName.type === 'Identifier' &&
                typeAnnotation.typeName.name === 'Uint8Array'
              ) {
                context.report({
                  node: param.typeAnnotation,
                  messageId: 'uint8ArrayTypeNotSupported',
                });
              }
            }
          });
        }
      },

      // Check for Uint8Array in arrow function parameter type annotations
      ArrowFunctionExpression: function (node) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const arrowNode = node as any;
        if (arrowNode.params) {
          arrowNode.params.forEach((param: any) => {
            if (param.typeAnnotation) {
              const typeAnnotation = param.typeAnnotation.typeAnnotation;
              if (
                typeAnnotation.type === 'TSTypeReference' &&
                typeAnnotation.typeName &&
                typeAnnotation.typeName.type === 'Identifier' &&
                typeAnnotation.typeName.name === 'Uint8Array'
              ) {
                context.report({
                  node: param.typeAnnotation,
                  messageId: 'uint8ArrayTypeNotSupported',
                });
              }
            }
          });
        }
      },

      // Check for Uint8Array in return type annotations
      TSTypeAnnotation: function (node) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const typeAnnotation = node as any;
        if (typeAnnotation.typeAnnotation) {
          const type = typeAnnotation.typeAnnotation;
          if (
            type.type === 'TSTypeReference' &&
            type.typeName &&
            type.typeName.type === 'Identifier' &&
            type.typeName.name === 'Uint8Array'
          ) {
            context.report({
              node,
              messageId: 'uint8ArrayTypeNotSupported',
            });
          }
        }
      },

      // Check for Uint8Array in type aliases (e.g., type T = Uint8Array)
      TSTypeAliasDeclaration: function (node) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const aliasNode = node as any;
        if (aliasNode.typeAnnotation) {
          const typeAnnotation = aliasNode.typeAnnotation;
          if (
            typeAnnotation.type === 'TSTypeReference' &&
            typeAnnotation.typeName &&
            typeAnnotation.typeName.type === 'Identifier' &&
            typeAnnotation.typeName.name === 'Uint8Array'
          ) {
            context.report({
              node: aliasNode.typeAnnotation,
              messageId: 'uint8ArrayTypeNotSupported',
            });
          }
        }
      },

      // Check for Uint8Array in property definitions (class properties, interface properties)
      PropertyDefinition: function (node) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const propNode = node as any;
        if (propNode.typeAnnotation) {
          const typeAnnotation = propNode.typeAnnotation.typeAnnotation;
          if (
            typeAnnotation.type === 'TSTypeReference' &&
            typeAnnotation.typeName &&
            typeAnnotation.typeName.type === 'Identifier' &&
            typeAnnotation.typeName.name === 'Uint8Array'
          ) {
            context.report({
              node: propNode.typeAnnotation,
              messageId: 'uint8ArrayTypeNotSupported',
            });
          }
        }
      },

      // Check for Uint8Array in TSPropertySignature (interface properties)
      TSPropertySignature: function (node) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const propNode = node as any;
        if (propNode.typeAnnotation) {
          const typeAnnotation = propNode.typeAnnotation.typeAnnotation;
          if (
            typeAnnotation.type === 'TSTypeReference' &&
            typeAnnotation.typeName &&
            typeAnnotation.typeName.type === 'Identifier' &&
            typeAnnotation.typeName.name === 'Uint8Array'
          ) {
            context.report({
              node: propNode.typeAnnotation,
              messageId: 'uint8ArrayTypeNotSupported',
            });
          }
        }
      },
    };
  },
};

export default rule;



