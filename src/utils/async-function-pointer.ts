import { Rule } from 'eslint';
import * as ts from 'typescript';
import { getCachedTypeChecker } from './type-aware-cache';

type Services = {
  program?: ts.Program;
  esTreeNodeToTSNodeMap?: { get(node: Rule.Node): ts.Node | undefined };
  tsNodeToESTreeNodeMap?: { get(node: ts.Node): Rule.Node | undefined };
};

type Substitutions = Map<ts.Symbol, ts.TypeNode>;

/** AFP<T> is an identity alias, so resolved function types alone lose its provenance. */
export function createTypedAsyncFunctionPointerListener(context: Rule.RuleContext): Rule.RuleListener | undefined {
  const services = context.sourceCode.parserServices as Services | undefined;
  if (!services?.program || !services.esTreeNodeToTSNodeMap) return undefined;
  const checker = getCachedTypeChecker(services.program);
  const reported = new Set<ts.Node>();

  function resolveSymbol(symbol: ts.Symbol | undefined): ts.Symbol | undefined {
    return symbol && (symbol.flags & ts.SymbolFlags.Alias) ? checker.getAliasedSymbol(symbol) : symbol;
  }

  function isPointerType(node: ts.TypeNode | undefined, substitutions: Substitutions = new Map(), seen = new Set<ts.Node>(), arrayDepth = 0): boolean {
    if (!node || seen.has(node)) return false;
    seen.add(node);
    if (ts.isParenthesizedTypeNode(node)) return isPointerType(node.type, substitutions, seen, arrayDepth);
    if (ts.isUnionTypeNode(node) || ts.isIntersectionTypeNode(node)) {
      return node.types.some(type => isPointerType(type, substitutions, new Set(seen), arrayDepth));
    }
    if (ts.isArrayTypeNode(node)) return arrayDepth > 0 && isPointerType(node.elementType, substitutions, seen, arrayDepth - 1);
    if (ts.isIndexedAccessTypeNode(node) && ts.isLiteralTypeNode(node.indexType) && ts.isStringLiteral(node.indexType.literal)) {
      return isPointerSymbol(checker.getPropertyOfType(checker.getTypeFromTypeNode(node.objectType), node.indexType.literal.text), substitutions, arrayDepth);
    }
    if (!ts.isTypeReferenceNode(node)) return false;
    const symbol = resolveSymbol(checker.getSymbolAtLocation(node.typeName));
    if (!symbol) return false;
    const replacement = substitutions.get(symbol);
    if (replacement) return isPointerType(replacement, substitutions, seen, arrayDepth);
    if (arrayDepth > 0 && ['Array', 'ReadonlyArray'].includes(symbol.getName()) && checker.isArrayType(checker.getTypeFromTypeNode(node))) {
      return isPointerType(node.typeArguments?.[0], substitutions, seen, arrayDepth - 1);
    }
    for (const declaration of symbol.declarations ?? []) {
      if (ts.isTypeAliasDeclaration(declaration)) {
        if (declaration.name.text === 'AsyncFunctionPointer' &&
            /(?:^|\/)hosanna-ui\/globals\.d\.[cm]?ts$/.test(declaration.getSourceFile().fileName.replace(/\\/g, '/'))) return arrayDepth === 0;
        const next = new Map(substitutions);
        declaration.typeParameters?.forEach((parameter, index) => {
          const argument = node.typeArguments?.[index] ?? parameter.default;
          const parameterSymbol = checker.getSymbolAtLocation(parameter.name);
          if (argument && parameterSymbol) next.set(parameterSymbol, argument);
        });
        if (isPointerType(declaration.type, next, new Set(seen), arrayDepth)) return true;
      }
      if (ts.isTypeParameterDeclaration(declaration) && isPointerType(declaration.constraint, substitutions, seen, arrayDepth)) return true;
    }
    return false;
  }

  function declaredType(node: ts.Declaration): ts.TypeNode | undefined {
    return 'type' in node ? (node as ts.Declaration & { type?: ts.TypeNode }).type : undefined;
  }

  function isPointerSymbol(symbol: ts.Symbol | undefined, substitutions?: Substitutions, arrayDepth = 0): boolean {
    return (resolveSymbol(symbol)?.declarations ?? []).some(declaration => isPointerType(declaredType(declaration), substitutions, new Set(), arrayDepth));
  }

  function isExportedFunction(declaration: ts.Declaration): boolean {
    if (!ts.isFunctionDeclaration(declaration) || !declaration.name) return false;
    if (!ts.isSourceFile(declaration.parent) && !ts.isModuleBlock(declaration.parent)) return false;
    const moduleNode = ts.isSourceFile(declaration.parent) ? declaration.parent : declaration.parent.parent;
    const moduleSymbol = checker.getSymbolAtLocation(ts.isModuleDeclaration(moduleNode) ? moduleNode.name : moduleNode);
    const functionSymbol = resolveSymbol(checker.getSymbolAtLocation(declaration.name));
    return !!moduleSymbol && checker.getExportsOfModule(moduleSymbol).some(exported => resolveSymbol(exported) === functionSymbol);
  }

  function unwrap(expression: ts.Expression): ts.Expression {
    let value = expression;
    while (ts.isParenthesizedExpression(value) || ts.isAsExpression(value) || ts.isTypeAssertionExpression(value) ||
           ts.isNonNullExpression(value) || ts.isSatisfiesExpression(value)) value = value.expression;
    return value;
  }

  /** Trace reads of existing serialized slots, never aliases of raw function declarations. */
  function isExistingPointer(expression: ts.Expression, arrayDepth = 0, seen = new Set<ts.Symbol>()): boolean {
    if (ts.isParenthesizedExpression(expression) || ts.isNonNullExpression(expression)) {
      return isExistingPointer(expression.expression, arrayDepth, seen);
    }
    if ((ts.isAsExpression(expression) || ts.isTypeAssertionExpression(expression)) &&
        isPointerType(expression.type, new Map(), new Set(), arrayDepth)) return true;
    const value = unwrap(expression);
    if (ts.isConditionalExpression(value)) {
      const branches = [value.whenTrue, value.whenFalse];
      return branches.some(branch => isExistingPointer(branch, arrayDepth, new Set(seen))) && branches.every(branch =>
        isExistingPointer(branch, arrayDepth, new Set(seen)) || ts.isStringLiteralLike(branch) || (ts.isIdentifier(branch) && branch.text === 'undefined'));

    }
    if (ts.isElementAccessExpression(value)) {
      const keyType = checker.getTypeAtLocation(value.argumentExpression);
      const keys = keyType.isUnion() ? keyType.types : [keyType];
      const ownerType = checker.getTypeAtLocation(value.expression);
      if (keys.every(key => key.isStringLiteral() && isPointerSymbol(checker.getPropertyOfType(ownerType, key.value), undefined, arrayDepth))) return true;
      if (keyType.flags & ts.TypeFlags.NumberLike) return isExistingPointer(value.expression, arrayDepth + 1, seen);
    }
    if (!ts.isIdentifier(value) && !ts.isPropertyAccessExpression(value) && !ts.isElementAccessExpression(value)) return false;
    const symbol = resolveSymbol(ts.isIdentifier(value) && ts.isShorthandPropertyAssignment(value.parent)
      ? checker.getShorthandAssignmentValueSymbol(value.parent)
      : checker.getSymbolAtLocation(ts.isPropertyAccessExpression(value) ? value.name : value));
    if (!symbol || seen.has(symbol)) return false;
    seen.add(symbol);
    if (isPointerSymbol(symbol, undefined, arrayDepth)) return true;
    return (symbol.declarations ?? []).some(declaration => {
      if (ts.isVariableDeclaration(declaration)) {
        if (declaration.initializer) return isExistingPointer(declaration.initializer, arrayDepth, new Set(seen));
        const loop = declaration.parent.parent;
        if (ts.isVariableDeclarationList(declaration.parent) && ts.isForOfStatement(loop)) {
          return isExistingPointer(loop.expression, arrayDepth + 1, seen);
        }
      }
      if (ts.isParameter(declaration)) {
        const callback = declaration.parent;
        const call = callback.parent;
        if ((ts.isArrowFunction(callback) || ts.isFunctionExpression(callback)) && callback.parameters[0] === declaration &&
            ts.isCallExpression(call) && call.arguments.includes(callback) && ts.isPropertyAccessExpression(call.expression) &&
            ['map', 'forEach', 'filter', 'find', 'findIndex', 'some', 'every'].includes(call.expression.name.text)) {
          return isExistingPointer(call.expression.expression, arrayDepth + 1, seen);
        }
      }
      return false;
    });
  }

  function isValidValue(expression: ts.Expression): boolean {
    const value = unwrap(expression);
    // Non-callable alternatives (e.g. string | AFP | undefined) remain TypeScript's responsibility.
    if (ts.isStringLiteralLike(value) || ts.isNumericLiteral(value) || value.kind === ts.SyntaxKind.NullKeyword ||
        (ts.isIdentifier(value) && value.text === 'undefined')) return true;
    if (ts.isConditionalExpression(value)) return isValidValue(value.whenTrue) && isValidValue(value.whenFalse);
    if (ts.isBinaryExpression(value) && [ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.AmpersandAmpersandToken].includes(value.operatorToken.kind)) {
      return isValidValue(value.left) && isValidValue(value.right);
    }
    if (ts.isIdentifier(value) || ts.isPropertyAccessExpression(value) || ts.isElementAccessExpression(value)) {
      const symbol = resolveSymbol(ts.isIdentifier(value) && ts.isShorthandPropertyAssignment(value.parent)
        ? checker.getShorthandAssignmentValueSymbol(value.parent)
        : checker.getSymbolAtLocation(ts.isPropertyAccessExpression(value) ? value.name : value));
      // Forwarding a declared AFP slot preserves an already serialized pointer. Ordinary callback
      // types do not qualify, even when their resolved signatures are structurally identical.
      if (isExistingPointer(value)) return true;
      return (symbol?.declarations ?? []).some(isExportedFunction);
    }
    if (ts.isCallExpression(value)) {
      const declaration = checker.getResolvedSignature(value)?.getDeclaration();
      return !!declaration && isPointerType(declaration.type);
    }
    return false;
  }

  function report(expression: ts.Expression, anchor?: ts.Node) {
    const value = unwrap(expression);
    if (reported.has(value) || isValidValue(value)) return;
    const reportNode = services?.tsNodeToESTreeNodeMap?.get(anchor ?? value);
    if (!reportNode) return;
    reported.add(value);
    context.report({ node: reportNode, messageId: 'invalidAsyncFunctionPointer' });
  }

  function propertyName(name: ts.PropertyName): string | undefined {
    if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;
    if (ts.isComputedPropertyName(name) && ts.isStringLiteralLike(name.expression)) return name.expression.text;
    return undefined;
  }

  function contextualPropertyIsPointer(node: ts.ObjectLiteralElementLike): boolean {
    if (!node.name || !ts.isObjectLiteralExpression(node.parent)) return false;
    const name = propertyName(node.name);
    const type = checker.getContextualType(node.parent);
    return !!name && !!type && isPointerSymbol(checker.getPropertyOfType(type, name));
  }

  function returnTypeIsPointer(node: ts.SignatureDeclaration): boolean {
    if (isPointerType(node.type)) return true;
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      const contextual = checker.getContextualType(node);
      return contextual?.getCallSignatures().some(signature => isPointerType(signature.getDeclaration()?.type)) ?? false;
    }
    return false;
  }

  function visit(node: ts.Node): void {
    if ((ts.isVariableDeclaration(node) || ts.isPropertyDeclaration(node) || ts.isParameter(node)) && node.initializer && isPointerType(node.type)) {
      report(node.initializer);
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken && isPointerSymbol(checker.getSymbolAtLocation(node.left))) {
      report(node.right);
    }
    if (ts.isPropertyAssignment(node) && contextualPropertyIsPointer(node)) report(node.initializer);
    if (ts.isShorthandPropertyAssignment(node) && contextualPropertyIsPointer(node)) report(node.name);
    if (ts.isMethodDeclaration(node) && ts.isObjectLiteralExpression(node.parent) && contextualPropertyIsPointer(node)) {
      const reportNode = services?.tsNodeToESTreeNodeMap?.get(node);
      if (reportNode) context.report({ node: reportNode, messageId: 'invalidAsyncFunctionPointer' });
    }
    if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
      const signature = checker.getResolvedSignature(node);
      const declaration = signature?.getDeclaration();
      const substitutions: Substitutions = new Map();
      declaration?.typeParameters?.forEach((parameter, index) => {
        const symbol = checker.getSymbolAtLocation(parameter.name);
        const argument = node.typeArguments?.[index];
        if (symbol && argument) substitutions.set(symbol, argument);
      });
      node.arguments?.forEach((argument, index) => {
        const parameter = signature?.parameters[index];
        if (parameter && isPointerSymbol(parameter, substitutions) && !ts.isSpreadElement(argument)) report(argument);
      });
    }
    if (ts.isReturnStatement(node) && node.expression) {
      let owner: ts.Node | undefined = node.parent;
      while (owner && !ts.isFunctionLike(owner)) owner = owner.parent;
      if (owner && ts.isFunctionLike(owner) && returnTypeIsPointer(owner)) report(node.expression);
    }
    if (ts.isArrowFunction(node) && !ts.isBlock(node.body) && returnTypeIsPointer(node)) report(node.body);
    if ((ts.isAsExpression(node) || ts.isTypeAssertionExpression(node) || ts.isSatisfiesExpression(node)) && isPointerType(node.type)) report(node.expression);
    ts.forEachChild(node, visit);
  }

  return {
    'Program:exit'(node) {
      const source = services.esTreeNodeToTSNodeMap?.get(node as Rule.Node);
      if (source && !source.getSourceFile().isDeclarationFile) visit(source);
    },
  };
}
