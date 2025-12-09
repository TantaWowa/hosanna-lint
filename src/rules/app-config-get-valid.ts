import { Rule } from 'eslint';
import { getAppConfig, jsonPathExists } from '../utils/app-config-loader';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Validate appConfig.get() and appConfig.get<Type>() calls reference valid paths in app.config.json',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      invalidAppConfigKey: 'App config key "{{path}}" does not exist in app.config.json',
      nonStringLiteral: 'appConfig.get() argument must be a string literal',
    },
  },
  create: function (context) {
    return {
      CallExpression: function (node) {
        // Check for appConfig.get() or obj.appConfig.get() calls
        if (
          node.callee &&
          node.callee.type === 'MemberExpression' &&
          node.callee.property &&
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'get'
        ) {
          // Check if the object is appConfig or something.appConfig
          const objectNode = node.callee.object;
          let isAppConfig = false;

          if (objectNode.type === 'Identifier' && objectNode.name === 'appConfig') {
            isAppConfig = true;
          } else if (objectNode.type === 'MemberExpression') {
            // Handle cases like someObj.appConfig.get()
            if (
              objectNode.property &&
              objectNode.property.type === 'Identifier' &&
              objectNode.property.name === 'appConfig'
            ) {
              isAppConfig = true;
            }
          }

          if (!isAppConfig) {
            return;
          }

          // Check if there's at least one argument
          if (!node.arguments || node.arguments.length === 0) {
            return;
          }

          const firstArg = node.arguments[0];

          // Only validate string literals
          if (firstArg.type === 'Literal' && typeof firstArg.value === 'string') {
            const pathStr = firstArg.value;
            const config = getAppConfig(context);

            if (!config) {
              // If app.config.json doesn't exist, skip validation
              return;
            }

            if (!jsonPathExists(config, pathStr)) {
              context.report({
                node: firstArg,
                messageId: 'invalidAppConfigKey',
                data: {
                  path: pathStr,
                },
              });
            }
          } else if (firstArg.type === 'TemplateLiteral') {
            // For template literals, we can only validate if they're simple (no expressions)
            if (firstArg.expressions && firstArg.expressions.length === 0 && firstArg.quasis && firstArg.quasis.length === 1) {
              const value = firstArg.quasis[0].value.cooked || firstArg.quasis[0].value.raw;
              if (typeof value === 'string') {
                const config = getAppConfig(context);
                if (!config) {
                  return;
                }
                if (!jsonPathExists(config, value)) {
                  context.report({
                    node: firstArg,
                    messageId: 'invalidAppConfigKey',
                    data: {
                      path: value,
                    },
                  });
                }
              }
            }
            // For template literals with expressions, skip validation
          }
          // For non-string literals (variables, etc.), skip validation
        }
      },
    };
  },
};

export default rule;

