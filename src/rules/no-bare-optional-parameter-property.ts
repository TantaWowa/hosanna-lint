import { Rule } from 'eslint';

/**
 * Compat guard for hsc < 1.29.0 (fixed by transpiler commit b10442f).
 *
 * BrightScript requires every optional argument to have a default in the
 * function signature. The transpiler emits `= invalid` for bare optional
 * params (`b?: T`), but before the fix the check read `.optional` off the
 * TSParameterProperty wrapper instead of the inner Identifier, so
 * `constructor(private config?: T)` lost its `= invalid` and calls omitting
 * the argument crashed on device with "Wrong number of function parameters".
 * Plain bare-optional params (`function f(b?: T)`, `method(b?: T)`) always
 * emitted `= invalid` correctly and are not flagged.
 */

type ParameterIdentifier = Rule.Node & {
  name: string;
  optional?: boolean;
  typeAnnotation?: { typeAnnotation: Rule.Node } & Rule.Node;
};

type TSParameterPropertyNode = Rule.Node & {
  parameter: Rule.Node;
};

/** Union members bind loosely; parenthesize annotations that would change meaning. */
function needsParens(typeText: string): boolean {
  return typeText.includes('=>') || /\bextends\b/.test(typeText);
}

function alreadyIncludesUndefined(typeText: string): boolean {
  return /\bundefined\b/.test(typeText);
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Constructor parameter properties must not be bare-optional; transpilers older than 1.29.0 drop the BrightScript default and crash on device',
      category: 'Best Practices',
      recommended: true,
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      bareOptionalParameterProperty:
        'Bare-optional parameter property "{{name}}?" loses its "= invalid" default in BrightScript signatures on hsc < 1.29.0, so calls omitting it crash on device ("Wrong number of function parameters"). Fixed in hsc 1.29.0. To stay compatible with older toolchains, give it an explicit default.',
      addExplicitUndefinedDefault: 'Replace "{{name}}?" with an explicit "= undefined" default',
    },
  },
  create: function (context) {
    return {
      TSParameterProperty: function (node: Rule.Node) {
        const param = (node as TSParameterPropertyNode).parameter;
        // AssignmentPattern means an explicit default exists; rest/patterns cannot be optional
        if (param.type !== 'Identifier') return;
        const id = param as ParameterIdentifier;
        if (!id.optional) return;

        const sourceCode = context.sourceCode;
        const name = id.name;
        let replacement: string;
        if (id.typeAnnotation) {
          const typeText = sourceCode.getText(id.typeAnnotation.typeAnnotation as Rule.Node);
          const unionText = alreadyIncludesUndefined(typeText)
            ? typeText
            : `${needsParens(typeText) ? `(${typeText})` : typeText} | undefined`;
          replacement = `${name}: ${unionText} = undefined`;
        } else {
          replacement = `${name} = undefined`;
        }

        context.report({
          node: param,
          messageId: 'bareOptionalParameterProperty',
          data: { name },
          suggest: [
            {
              messageId: 'addExplicitUndefinedDefault',
              data: { name },
              fix: (fixer) => fixer.replaceText(param, replacement),
            },
          ],
        });
      },
    };
  },
};

export default rule;
