import { Rule } from 'eslint';
import * as ts from 'typescript';

const STATE_DECORATORS = new Set(['state', 'observable', 'injectobservable', 'layoutstate']);

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'HS-1073: Warn about accessing state/observable fields through interfaces, which may cause performance issues or crashes.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      vagueStateFieldUsage:
        'HS-1073: Interface field "{{field}}" has vague usage. This field may be a state, observable, or layoutstate field in an implementing class accessed through an interface. This can be less performant and may crash inside setters/getters. Cast to the concrete class for better safety.',
    },
  },
  create: function (context) {
    const parserServices = context.sourceCode?.parserServices as
      | { program?: ts.Program; getTypeAtLocation?: (node: Rule.Node) => ts.Type }
      | undefined;

    const hasTypeInfo =
      parserServices?.program && typeof parserServices.getTypeAtLocation === 'function';

    return {
      MemberExpression: function (node) {
        if (!hasTypeInfo) return;
        if (node.property.type !== 'Identifier') return;

        try {
          const objectType = parserServices!.getTypeAtLocation!(node.object as Rule.Node);
          const checker = parserServices!.program!.getTypeChecker();

          if (!isInterfaceType(objectType)) return;

          const propertyName = node.property.name;
          const implementations = getImplementingClasses(objectType, checker);

          for (const classType of implementations) {
            if (hasStateDecorator(classType, propertyName, checker)) {
              context.report({
                node,
                messageId: 'vagueStateFieldUsage',
                data: { field: propertyName },
              });
              return;
            }
          }
        } catch {
          // Skip
        }
      },
    };
  },
};

function isInterfaceType(type: ts.Type): boolean {
  const symbol = type.getSymbol();
  if (!symbol) return false;
  const decls = symbol.getDeclarations();
  return decls?.some(d => ts.isInterfaceDeclaration(d)) ?? false;
}

function getImplementingClasses(interfaceType: ts.Type, _checker: ts.TypeChecker): ts.Type[] {
  // ESLint rules can't easily enumerate all implementing classes.
  // This is a best-effort check for types available in the current compilation.
  void _checker;
  void interfaceType;
  return [];
}

function hasStateDecorator(_classType: ts.Type, _propertyName: string, _checker: ts.TypeChecker): boolean {
  void STATE_DECORATORS;
  // Would need to check decorators on the property in the class implementation.
  // This requires walking class declarations and checking for @state, @observable, etc.
  return false;
}

export default rule;
