import { Rule } from 'eslint';
import * as ts from 'typescript';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'HS-1057: Warn about getter/setter mismatches between class members and their interface definitions.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      getterSetterMismatch:
        'HS-1057: Class member "{{member}}" and its interface have different definitions (getter/setter vs property). Hosanna requires class members and interfaces to have the same definition for this member.',
    },
  },
  create: function (context) {
    const parserServices = context.sourceCode?.parserServices as
      | { program?: ts.Program; getTypeAtLocation?: (node: Rule.Node) => ts.Type }
      | undefined;

    const hasTypeInfo =
      parserServices?.program && typeof parserServices.getTypeAtLocation === 'function';

    return {
      ClassDeclaration: function (node) {
        if (!hasTypeInfo) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const classNode = node as any;
        const getters = new Set<string>();
        const setters = new Set<string>();

        for (const member of classNode.body.body) {
          if (member.kind === 'get' && member.key?.type === 'Identifier') {
            getters.add(member.key.name);
          }
          if (member.kind === 'set' && member.key?.type === 'Identifier') {
            setters.add(member.key.name);
          }
        }

        if (getters.size === 0 && setters.size === 0) return;

        try {
          const checker = parserServices!.program!.getTypeChecker();
          const classType = parserServices!.getTypeAtLocation!(node);
          const classSymbol = classType.getSymbol();
          if (!classSymbol) return;

          const declarations = classSymbol.getDeclarations();
          if (!declarations) return;

          for (const decl of declarations) {
            if (!ts.isClassDeclaration(decl)) continue;
            const heritages = decl.heritageClauses;
            if (!heritages) continue;

            for (const heritage of heritages) {
              if (heritage.token !== ts.SyntaxKind.ImplementsKeyword) continue;
              for (const typeNode of heritage.types) {
                const interfaceType = checker.getTypeAtLocation(typeNode);
                const interfaceProps = interfaceType.getProperties();

                for (const prop of interfaceProps) {
                  const propName = prop.getName();
                  const isGetterOrSetter = getters.has(propName) || setters.has(propName);
                  if (!isGetterOrSetter) continue;

                  const propDecl = prop.getDeclarations()?.[0];
                  if (propDecl && ts.isPropertySignature(propDecl)) {
                    const classMember = classNode.body.body.find(
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (m: any) => m.key?.name === propName && (m.kind === 'get' || m.kind === 'set')
                    );
                    if (classMember) {
                      context.report({
                        node: classMember.key,
                        messageId: 'getterSetterMismatch',
                        data: { member: propName },
                      });
                    }
                  }
                }
              }
            }
          }
        } catch {
          // Skip if analysis fails
        }
      },
    };
  },
};

export default rule;
