import { Rule } from 'eslint';

const ALLOWED_TOP_LEVEL_NODE_TYPES = new Set([
  'ImportDeclaration',
  'ExportNamedDeclaration',
  'ExportAllDeclaration',
  'ExportDefaultDeclaration',
  'FunctionDeclaration',
  'ClassDeclaration',
  'TSInterfaceDeclaration',
  'TSTypeAliasDeclaration',
  'TSDeclareFunction',
  'TSImportEqualsDeclaration',
]);

function hasNoModuleDirective(context: Rule.RuleContext): boolean {
  return context.sourceCode
    .getAllComments()
    .some((comment) => comment.value.includes('hs:no-module'));
}

function getRuntimeNode(node: Rule.Node): Rule.Node | undefined {
  if (isHsNativeRokuExpressionStatement(node)) return undefined;

  if (node.type === 'ExportNamedDeclaration' || node.type === 'ExportDefaultDeclaration') {
    const declaration = (node as Rule.Node & { declaration?: Rule.Node | null }).declaration;
    if (!declaration) return undefined;
    if (ALLOWED_TOP_LEVEL_NODE_TYPES.has(declaration.type)) return undefined;
    return declaration;
  }

  if (ALLOWED_TOP_LEVEL_NODE_TYPES.has(node.type)) return undefined;
  return node;
}

function isHsNativeRokuExpressionStatement(node: Rule.Node): boolean {
  if (node.type !== 'ExpressionStatement') return false;
  const expression = (node as Rule.Node & { expression?: Rule.Node }).expression;
  if (!expression || expression.type !== 'CallExpression') return false;
  const callee = (expression as Rule.Node & { callee?: Rule.Node }).callee;
  return callee?.type === 'Identifier' && (callee as Rule.Node & { name?: string }).name === 'hs_native_roku';
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'HS-1133: Disallow top-level runtime statements in hs:no-module files. BrightScript file scope only supports declarations that transpile to function-like declarations.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      topLevelRuntimeInNoModule:
        'HS-1133: Top-level runtime statements are not allowed in hs:no-module files because they emit invalid BrightScript file-scope code. Move this into a function or remove hs:no-module.',
    },
  },
  create(context) {
    return {
      Program(node) {
        if (!hasNoModuleDirective(context)) return;

        for (const statement of node.body) {
          const runtimeNode = getRuntimeNode(statement as Rule.Node);
          if (!runtimeNode) continue;

          context.report({
            node: runtimeNode,
            messageId: 'topLevelRuntimeInNoModule',
          });
        }
      },
    };
  },
};

export default rule;
