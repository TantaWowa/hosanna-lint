import { Rule } from 'eslint';
import * as ts from 'typescript';

const STATE_DECORATORS = new Set(['state', 'observable', 'injectobservable', 'layoutstate']);

type StatefulPropsByInterface = Map<string, Set<string>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDecoratorBaseNames(decorators: any[] | undefined): Set<string> {
  const names = new Set<string>();
  for (const d of decorators ?? []) {
    const e = d?.expression;
    if (!e) continue;
    if (e.type === 'Identifier' && e.name) names.add(e.name);
    if (e.type === 'CallExpression' && e.callee?.type === 'Identifier' && e.callee.name) {
      names.add(e.callee.name);
    }
  }
  return names;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hasStatefulDecorator(decorators: any[] | undefined): boolean {
  for (const n of getDecoratorBaseNames(decorators)) {
    if (STATE_DECORATORS.has(n)) return true;
  }
  return false;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function collectInterfaceNamesInProgramBody(body: any[]): Set<string> {
  const names = new Set<string>();
  for (const stmt of body) {
    if (stmt?.type === 'TSInterfaceDeclaration' && stmt.id?.type === 'Identifier' && stmt.id.name) {
      names.add(stmt.id.name);
    }
  }
  return names;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function collectStatefulPropsByImplementedInterface(
  body: any[],
  interfacesDefinedInFile: Set<string>
): StatefulPropsByInterface {
  const out: StatefulPropsByInterface = new Map();

  function add(iface: string, prop: string) {
    if (!interfacesDefinedInFile.has(iface)) return;
    let set = out.get(iface);
    if (!set) {
      set = new Set();
      out.set(iface, set);
    }
    set.add(prop);
  }

  for (const stmt of body) {
    if (stmt?.type !== 'ClassDeclaration' || !stmt.implements?.length) continue;
    for (const impl of stmt.implements) {
      const iname =
        impl.expression?.type === 'Identifier' ? impl.expression.name : null;
      if (!iname || !interfacesDefinedInFile.has(iname)) continue;

      for (const el of stmt.body?.body ?? []) {
        if (
          (el.type === 'PropertyDefinition' || el.type === 'ClassProperty') &&
          el.key?.type === 'Identifier' &&
          hasStatefulDecorator(el.decorators)
        ) {
          add(iname, el.key.name);
        }
      }
    }
  }

  return out;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'HS-1073: Warn when accessing a field through an interface if the same file has a class that implements that interface and marks the field with @state / @observable / @injectobservable / @layoutstate. Cross-file implements are ignored (false negatives).',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      vagueStateFieldUsage:
        'HS-1073: Interface field "{{field}}" has vague usage. This field may be a state, observable, or layoutstate field in an implementing class in this file accessed through an interface. Cast to the concrete class for better safety.',
    },
  },
  create: function (context) {
    const parserServices = context.sourceCode?.parserServices as
      | { program?: ts.Program; getTypeAtLocation?: (node: Rule.Node) => ts.Type }
      | undefined;

    const hasTypeInfo =
      parserServices?.program && typeof parserServices.getTypeAtLocation === 'function';

    const programNode = context.sourceCode.ast as { type?: string; body?: unknown[] };
    const body = Array.isArray(programNode.body) ? programNode.body : [];
    const interfacesInFile = collectInterfaceNamesInProgramBody(body);
    const statefulByInterface = collectStatefulPropsByImplementedInterface(body, interfacesInFile);

    if (statefulByInterface.size === 0) {
      return {};
    }

    const program = parserServices!.program!;
    const currentSf = program.getSourceFile(context.filename);
    if (!currentSf) {
      return {};
    }

    return {
      MemberExpression: function (node) {
        if (!hasTypeInfo) return;
        if (node.property.type !== 'Identifier') return;

        try {
          const objectType = parserServices!.getTypeAtLocation!(node.object as Rule.Node);
          const symbol = objectType.getSymbol() ?? objectType.aliasSymbol;
          if (!symbol) return;

          const decl = symbol.getDeclarations()?.find((d) => ts.isInterfaceDeclaration(d));
          if (!decl || !ts.isInterfaceDeclaration(decl)) return;
          if (decl.getSourceFile().fileName !== currentSf.fileName) return;

          const interfaceName = decl.name.text;
          const propSet = statefulByInterface.get(interfaceName);
          if (!propSet) return;

          const propertyName = node.property.name;
          if (!propSet.has(propertyName)) return;

          context.report({
            node,
            messageId: 'vagueStateFieldUsage',
            data: { field: propertyName },
          });
        } catch {
          // Skip
        }
      },
    };
  },
};

export default rule;
