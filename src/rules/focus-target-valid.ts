import { Rule } from 'eslint';
import * as ts from 'typescript';
import { getHosannaTypeServices, isHosannaType, unwrapHosannaExpression } from '../utils/hosanna-view-types';

interface FocusReference { target: string; direction: string; node: ts.Node; }
interface DeclaredView {
  id?: string;
  dynamicId: boolean;
  map: FocusReference[];
  children: DeclaredView[];
  customFocus: boolean;
}

const sentinels = new Set(['exit', 'maintain', 'none']);
const ownerMutationMethods = new Set(['addSubView', 'insertSubView', 'removeSubView', 'buildView', 'inflateViewStructs', 'applyIdsToViewStructs']);
const structuralFluentMethods = new Set(['setState', 'applyInitialState', 'configure', 'assign', 'children']);

function nameOf(name: ts.PropertyName | undefined): string | undefined {
  if (!name) return undefined;
  if (ts.isIdentifier(name) || ts.isStringLiteralLike(name) || ts.isNumericLiteral(name)) return name.text;
  if (ts.isComputedPropertyName(name) && ts.isStringLiteralLike(name.expression)) return name.expression.text;
  return undefined;
}

function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0]; row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const old = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = old;
    }
  }
  return row[b.length];
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: 'Validate literal nextFocusMap targets only within a completely resolved Hosanna view owner.' },
    schema: [],
    messages: {
      missingTarget: 'FOCUS-001: Focus target "{{target}}" for "{{direction}}" is absent from the statically resolved declarations owned by "{{owner}}".{{suggestion}} Reference an ID declared in this owner, or express navigation across owners through an explicit focus-boundary contract. A similarly named view elsewhere in the screen is not in this lookup scope.',
    },
  },
  create(context) {
    const services = getHosannaTypeServices(context);
    if (!services) return {};
    const { checker } = services;
    const reported = new Set<ts.Node>();
    const sourceCode = context.sourceCode;
    const referenceCounts = new Map<ts.Symbol, number>();
    function referenceCount(symbol: ts.Symbol, source: ts.SourceFile): number {
      const existing = referenceCounts.get(symbol);
      if (existing !== undefined) return existing;
      let count = 0;
      function visit(node: ts.Node): void {
        if (ts.isIdentifier(node) && checker.getSymbolAtLocation(node) === symbol &&
            !(ts.isVariableDeclaration(node.parent) && node.parent.name === node)) count++;
        ts.forEachChild(node, visit);
      }
      visit(source);
      referenceCounts.set(symbol, count);
      return count;
    }

    function resolve(node: ts.Expression, seen = new Set<ts.Node>()): ts.Expression {
      const unwrapped = unwrapHosannaExpression(node) as ts.Expression;
      if (seen.has(unwrapped)) return unwrapped;
      seen.add(unwrapped);
      if (ts.isIdentifier(unwrapped)) {
        const symbol = checker.getSymbolAtLocation(unwrapped);
        const declaration = symbol?.valueDeclaration;
        if (declaration && ts.isVariableDeclaration(declaration) && declaration.initializer &&
            ts.isVariableDeclarationList(declaration.parent) && (declaration.parent.flags & ts.NodeFlags.Const)) {
          // Object/array declarations must be local to the current source. Imported constants
          // may be mutated or assembled elsewhere, so they do not close an ownership scope.
          const initializer = unwrapHosannaExpression(declaration.initializer);
          const isReferenceValue = ts.isObjectLiteralExpression(initializer) || ts.isArrayLiteralExpression(initializer) || ts.isCallExpression(initializer);
          if (isReferenceValue && symbol && referenceCount(symbol, unwrapped.getSourceFile()) !== 1) return unwrapped;
          if (declaration.getSourceFile() === unwrapped.getSourceFile()) return resolve(declaration.initializer, seen);
        }
      }
      return unwrapped;
    }

    function literal(node: ts.Expression): string | undefined {
      const value = resolve(node);
      if (ts.isStringLiteralLike(value)) return value.text;
      const type = checker.getTypeAtLocation(value);
      return type.isStringLiteral() ? type.value : undefined;
    }

    function focusMap(node: ts.Expression): FocusReference[] {
      const value = resolve(node);
      if (!ts.isObjectLiteralExpression(value)) return [];
      const refs = new Map<string, FocusReference>();
      for (const prop of value.properties) {
        if (ts.isSpreadAssignment(prop)) return []; // An unknown spread may overwrite any direction.
        if (!ts.isPropertyAssignment(prop) && !ts.isShorthandPropertyAssignment(prop)) return [];
        const direction = nameOf(prop.name);
        if (direction === undefined) return [];
        const expression = ts.isPropertyAssignment(prop) ? prop.initializer : prop.name;
        const target = literal(expression);
        refs.delete(direction);
        if (target && !sentinels.has(target)) refs.set(direction, { target, direction, node: expression });
      }
      return [...refs.values()];
    }

    function applyProps(node: ts.Expression, view: DeclaredView): boolean {
      const value = resolve(node);
      if (!ts.isObjectLiteralExpression(value)) return false;
      for (const prop of value.properties) {
        if (!ts.isPropertyAssignment(prop) && !ts.isShorthandPropertyAssignment(prop)) return false;
        const name = nameOf(prop.name);
        if (name === undefined) return false;
        const expression = ts.isPropertyAssignment(prop) ? prop.initializer : prop.name;
        if (name === 'id') {
          view.id = literal(expression);
          view.dynamicId = view.id === undefined;
        } else if (name === 'nextFocusMap') {
          view.map = focusMap(expression);
        }
      }
      return true;
    }

    function parseArray(node: ts.Expression, seen: Set<ts.Node>): DeclaredView[] | undefined {
      const value = resolve(node);
      if (!ts.isArrayLiteralExpression(value) || seen.has(value)) return undefined;
      const nextSeen = new Set(seen).add(value);
      const views: DeclaredView[] = [];
      for (const element of value.elements) {
        if (ts.isSpreadElement(element)) {
          const spread = parseArray(element.expression, nextSeen);
          if (!spread) return undefined;
          views.push(...spread);
        } else {
          const view = parseView(element, nextSeen);
          if (!view) return undefined;
          views.push(view);
        }
      }
      return views;
    }

    function parseView(node: ts.Expression, seen: Set<ts.Node>): DeclaredView | undefined {
      const value = resolve(node);
      if (seen.has(value) || !ts.isCallExpression(value) ||
          !isHosannaType(checker, checker.getTypeAtLocation(value), ['ViewStruct'])) return undefined;
      const nextSeen = new Set(seen).add(value);
      const callee = unwrapHosannaExpression(value.expression);
      if (ts.isPropertyAccessExpression(callee) &&
          isHosannaType(checker, checker.getTypeAtLocation(callee.expression), ['ViewStruct'])) {
        const view = parseView(callee.expression, nextSeen);
        if (!view) return undefined;
        const method = callee.name.text;
        const declaration = checker.getResolvedSignature(value)?.getDeclaration();
        const file = declaration?.getSourceFile().fileName.replace(/\\/g, '/');
        // Only framework/generated fluent setters have understood structural behavior.
        if (!file || (!/\/hosanna-ui\/views\/lib\/view-api(?:\.d)?\.ts$/.test(file) && !/-generated-struct(?:\.d)?\.ts$/.test(file))) return undefined;
        if (method === 'id') {
          view.id = value.arguments[0] ? literal(value.arguments[0]) : undefined;
          view.dynamicId = view.id === undefined;
        } else if (method === 'nextFocusMap') {
          view.map = value.arguments[0] ? focusMap(value.arguments[0]) : [];
        } else if (method === 'onFindNextFocusable') {
          view.customFocus = true;
        } else if (structuralFluentMethods.has(method)) {
          return undefined;
        }
        return view;
      }

      const declaration = checker.getResolvedSignature(value)?.getDeclaration();
      if (!declaration || !/-generated-struct(?:\.d)?\.ts$/.test(declaration.getSourceFile().fileName)) return undefined;
      const view: DeclaredView = { dynamicId: false, map: [], children: [], customFocus: false };
      for (const argument of value.arguments) {
        const argumentValue = resolve(argument);
        if (ts.isArrayLiteralExpression(argumentValue)) {
          const children = parseArray(argumentValue, nextSeen);
          if (!children) return undefined;
          view.children.push(...children);
        } else if (argumentValue.kind === ts.SyntaxKind.UndefinedKeyword || (ts.isIdentifier(argumentValue) && argumentValue.text === 'undefined')) {
          continue;
        } else if (!applyProps(argument, view)) {
          return undefined;
        }
      }
      return view;
    }

    function ownerIsClosed(cls: ts.ClassDeclaration): boolean {
      const type = checker.getTypeAtLocation(cls);
      for (const methodName of ['decorateViews', 'applyIdsToViewStructs', 'buildView', 'inflateViewStructs', 'getSubView', 'insertSubView']) {
        const declaration = checker.getPropertyOfType(type, methodName)?.valueDeclaration;
        if (declaration && !/\/hosanna-ui\/views\/lib\/BaseView(?:\.d)?\.ts$/.test(declaration.getSourceFile().fileName.replace(/\\/g, '/'))) return false;
      }
      let mutated = false;
      function inspect(node: ts.Node): void {
        if (ts.isCallExpression(node)) {
          const callee = unwrapHosannaExpression(node.expression);
          if (ts.isPropertyAccessExpression(callee) || ts.isElementAccessExpression(callee)) {
            const receiver = unwrapHosannaExpression(callee.expression);
            const methodName = ts.isPropertyAccessExpression(callee) ? callee.name.text : literal(callee.argumentExpression);
            if ((receiver.kind === ts.SyntaxKind.ThisKeyword || receiver.kind === ts.SyntaxKind.SuperKeyword) &&
                methodName && ownerMutationMethods.has(methodName)) mutated = true;
          }
        }
        ts.forEachChild(node, inspect);
      }
      // App-owned inherited methods can inject additional subviews as well.
      const seen = new Set<ts.Type>();
      function inspectType(current: ts.Type): void {
        if (seen.has(current)) return;
        seen.add(current);
        for (const declaration of current.getSymbol()?.declarations ?? []) {
          if (ts.isClassDeclaration(declaration) && !/\/hosanna-ui\/views\/lib\/BaseView(?:\.d)?\.ts$/.test(declaration.getSourceFile().fileName.replace(/\\/g, '/'))) inspect(declaration);
        }
        // Instantiated generic intermediates may have only TypeReference flags.
        // Inspect their declaration target before walking the remaining ancestry.
        if ((current.flags & ts.TypeFlags.Object) && ((current as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference)) {
          const target = (current as ts.TypeReference).target;
          if (target !== current) inspectType(target);
        }
        if (current.isClassOrInterface()) for (const base of checker.getBaseTypes(current)) inspectType(base);
      }
      inspectType(type);
      return !mutated;
    }

    function validate(expression: ts.Expression, cls: ts.ClassDeclaration): void {
      const roots = parseArray(expression, new Set());
      if (!roots) return;
      const flattened: DeclaredView[] = [];
      function flatten(view: DeclaredView): void { flattened.push(view); view.children.forEach(flatten); }
      roots.forEach(flatten);
      if (flattened.some(view => view.dynamicId)) return;
      const ids = new Set(flattened.flatMap(view => view.id ? [view.id] : []));
      const hasGeneratedIds = flattened.some(view => !view.id);
      for (const view of flattened) {
        if (view.customFocus) continue;
        for (const reference of view.map) {
          if (ids.has(reference.target) || reported.has(reference.node)) continue;
          // Auto IDs depend on the runtime owner id. Do not claim their absence.
          if (hasGeneratedIds && /(?:_hsvid_\d+|[-]\d+)$/.test(reference.target)) continue;
          const nearest = [...ids].sort((a, b) => distance(a, reference.target) - distance(b, reference.target))[0];
          const suggestion = nearest && distance(nearest, reference.target) <= Math.max(1, Math.floor(reference.target.length / 4))
            ? ' Did you mean "' + nearest + '"?' : '';
          const start = sourceCode.getLocFromIndex(reference.node.getStart());
          const end = sourceCode.getLocFromIndex(reference.node.getEnd());
          context.report({ loc: { start, end }, messageId: 'missingTarget', data: {
            target: reference.target, direction: reference.direction, owner: cls.name?.text ?? '<anonymous view>', suggestion,
          } });
          reported.add(reference.node);
        }
      }
    }

    return {
      ClassDeclaration(node) {
        const cls = services.nodeAt(node);
        if (!ts.isClassDeclaration(cls) || !isHosannaType(checker, checker.getTypeAtLocation(cls), ['BaseView']) || !ownerIsClosed(cls)) return;
        const method = cls.members.find(member => ts.isMethodDeclaration(member) && nameOf(member.name) === 'getViews');
        if (!method || !ts.isMethodDeclaration(method) || !method.body) return;
        // Keep the first implementation limited to immutable declarations and return branches.
        // Mutation statements or opaque helpers make the complete target scope unprovable.
        function inspect(statement: ts.Statement): boolean {
          if (ts.isReturnStatement(statement)) return true;
          if (ts.isVariableStatement(statement)) return Boolean(statement.declarationList.flags & ts.NodeFlags.Const);
          if (ts.isBlock(statement)) return statement.statements.every(inspect);
          if (ts.isIfStatement(statement)) return inspect(statement.thenStatement) && (!statement.elseStatement || inspect(statement.elseStatement));
          return ts.isEmptyStatement(statement);
        }
        if (!method.body.statements.every(inspect)) return;
        let mutableAliases = false;
        function checkMutation(part: ts.Node): void {
          if (ts.isFunctionLike(part)) return;
          if ((ts.isBinaryExpression(part) && part.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && part.operatorToken.kind <= ts.SyntaxKind.LastAssignment) ||
              ts.isDeleteExpression(part) ||
              ((ts.isPrefixUnaryExpression(part) || ts.isPostfixUnaryExpression(part)) &&
                (part.operator === ts.SyntaxKind.PlusPlusToken || part.operator === ts.SyntaxKind.MinusMinusToken))) mutableAliases = true;
          if (ts.isCallExpression(part) && ts.isPropertyAccessExpression(part.expression) &&
              ts.isIdentifier(part.expression.expression)) {
            const receiver = checker.getTypeAtLocation(part.expression.expression);
            if (checker.isArrayType(receiver) || checker.isTupleType(receiver) || isHosannaType(checker, receiver, ['ViewStruct'])) mutableAliases = true;
          }
          ts.forEachChild(part, checkMutation);
        }
        ts.forEachChild(method.body, checkMutation);
        if (mutableAliases) return;
        function visit(node: ts.Node): void {
          if (ts.isReturnStatement(node) && node.expression) validate(node.expression, cls as ts.ClassDeclaration);
          else if (!ts.isFunctionLike(node)) ts.forEachChild(node, visit);
        }
        ts.forEachChild(method.body, visit);
      },
    };
  },
};
export default rule;
