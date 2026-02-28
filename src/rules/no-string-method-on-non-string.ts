import { Rule } from 'eslint';
import * as ts from 'typescript';

// Methods that are EXCLUSIVELY string methods (not shared with Array or other types)
const STRING_ONLY_METHODS = new Set([
  'toUpperCase', 'toLowerCase', 'toLocaleLowerCase', 'toLocaleUpperCase',
  'charAt', 'charCodeAt', 'split', 'trim', 'startsWith', 'endsWith',
  'padStart', 'padEnd', 'repeat', 'trimStart', 'trimEnd', 'substring',
  'match', 'matchAll', 'replace', 'replaceAll', 'substr', 'search',
  'normalize', 'codePointAt', 'localeCompare',
]);

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'HS-1106: Warn when calling string-only methods on a non-string type. Only flags methods exclusive to strings (not shared with Array).',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      stringMethodOnNonString:
        'HS-1106: The method "{{method}}" is a string method, but the type of the object may not be a string (got "{{type}}"). Cast to string or add type information.',
    },
  },
  create: function (context) {
    const parserServices = context.sourceCode?.parserServices as
      | { program?: ts.Program; getTypeAtLocation?: (node: Rule.Node) => ts.Type }
      | undefined;

    const hasTypeInfo =
      parserServices?.program && typeof parserServices.getTypeAtLocation === 'function';

    return {
      CallExpression: function (node) {
        if (!hasTypeInfo) return;
        if (
          node.callee.type !== 'MemberExpression' ||
          node.callee.property.type !== 'Identifier'
        ) return;

        const methodName = node.callee.property.name;
        if (!STRING_ONLY_METHODS.has(methodName)) return;

        try {
          const objectType = parserServices!.getTypeAtLocation!(node.callee.object as Rule.Node);
          const checker = parserServices!.program!.getTypeChecker();

          if (objectType.flags & ts.TypeFlags.Any) return;
          if (objectType.flags & ts.TypeFlags.Unknown) return;
          if (objectType.flags & ts.TypeFlags.StringLike) return;
          if (objectType.isUnion() && objectType.types.some(t => t.flags & ts.TypeFlags.StringLike)) return;

          // Check if the receiver type actually declares this method
          // (e.g. a class with its own repeat() method should not be flagged)
          const receiverType = checker.getApparentType(objectType);
          const methodSymbol = receiverType.getProperty(methodName);
          if (methodSymbol) {
            const declarations = methodSymbol.getDeclarations();
            if (declarations && declarations.length > 0) {
              const isFromStringPrototype = declarations.some(decl => {
                const sourceFile = decl.getSourceFile();
                return sourceFile && sourceFile.fileName.includes('lib.es');
              });
              // If the method is declared on the class itself (not from lib.es*), don't flag
              if (!isFromStringPrototype) return;
            }
          }

          context.report({
            node: node.callee.property,
            messageId: 'stringMethodOnNonString',
            data: { method: methodName, type: checker.typeToString(objectType) },
          });
        } catch {
          // Skip if type lookup fails
        }
      },
    };
  },
};

export default rule;
