import { Rule } from 'eslint';
import * as ts from 'typescript';
import { getHosannaTypeServices, isHosannaSymbol, isHosannaType, isHosannaViewType } from '../utils/hosanna-view-types';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: 'ARC-001: Require matching Hosanna @view registration for concrete application views.', recommended: true },
    schema: [{
      type: 'object',
      properties: {
        mode: { enum: ['application', 'framework'] },
        allowedClasses: { type: 'array', items: { type: 'string' }, uniqueItems: true },
      },
      additionalProperties: false,
    }],
    messages: {
      missing: "ARC-001: {{className}} is a concrete Hosanna view without @view registration. Add @view('{{viewName}}') and use class {{expectedClass}} so Hosanna can generate its view metadata. If this is only an inheritance base, declare it abstract.",
      mismatch: "ARC-001: @view('{{viewName}}') does not match class {{className}}. Use class {{expectedClass}} or change the decorator to @view('{{suggestedName}}'). The registration and class name must identify the same view.",
      missingSuffix: "ARC-001: @view('{{viewName}}') requires class {{expectedClass}}, but this class is named {{className}}. Rename the class to {{expectedClass}} so the registration and generated view metadata agree.",
      dynamicName: "ARC-001: {{className}} has a dynamic @view name. Use a string literal, such as @view('{{viewName}}'), matching class {{expectedClass}} so Hosanna can generate a stable view registration.",
    },
  },
  create(context) {
    const options = context.options[0] as { mode?: 'application' | 'framework'; allowedClasses?: string[] } | undefined;
    const services = getHosannaTypeServices(context);
    if (!services || options?.mode === 'framework') return {};
    const allowed = new Set(options?.allowedClasses ?? []);
    return {
      ClassDeclaration(node) {
        const declaration = services.nodeAt(node);
        if (!ts.isClassDeclaration(declaration) || !declaration.name) return;
        if (declaration.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AbstractKeyword || modifier.kind === ts.SyntaxKind.DeclareKeyword)) return;
        const className = declaration.name.text;
        if (allowed.has(className)) return;
        const type = services.checker.getTypeAtLocation(declaration);
        if (!isHosannaViewType(services.checker, type) || isHosannaType(services.checker, type, ['BaseApp'])) return;
        const viewName = className.endsWith('View') ? className.slice(0, -4) : className;
        const decorators = ts.canHaveDecorators(declaration) ? ts.getDecorators(declaration) ?? [] : [];
        const registration = decorators.find(decorator => {
          const expression = decorator.expression;
          const callee = ts.isCallExpression(expression) ? expression.expression : expression;
          return isHosannaSymbol(services.checker, services.checker.getSymbolAtLocation(callee), 'view');
        });
        if (!registration) {
          context.report({ node, messageId: 'missing', data: { className, viewName, expectedClass: `${viewName}View` } });
          return;
        }
        const expression = registration.expression;
        const argument = ts.isCallExpression(expression) ? expression.arguments[0] : undefined;
        if (!argument || !ts.isStringLiteralLike(argument) || argument.text === '') {
          context.report({ node, messageId: 'dynamicName', data: { className, viewName, expectedClass: `${viewName}View` } });
        } else if (className !== `${argument.text}View`) {
          context.report({ node, messageId: className.endsWith('View') ? 'mismatch' : 'missingSuffix', data: { className, viewName: argument.text, expectedClass: `${argument.text}View`, suggestedName: viewName } });
        }
      },
    };
  },
};

export default rule;
