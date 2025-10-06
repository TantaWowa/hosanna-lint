import { Rule } from 'eslint';

// BrightScript reserved words that cannot be used as variable or function names
const BRIGHTSCRIPT_RESERVED_WORDS = new Set([
  'and',
  'createobject',
  'dim',
  'each',
  'else',
  'elseif',
  'endif',
  'end',
  'endfor',
  'endfunction',
  'endsub',
  'endwhile',
  'exit',
  'exitwhile',
  'false',
  'for',
  'function',
  'goto',
  'if',
  'invalid',
  'let',
  'line_num',
  'next',
  'not',
  'objfun',
  'or',
  'pos',
  'print',
  'rem',
  'return',
  'rnd',
  'step',
  'stop',
  'sub',
  'tab',
  'then',
  'to',
  'true',
  'type',
  'while'
]);

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow BrightScript reserved words as variable or function names',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      reservedWordUsed: 'The word "{{word}}" is a reserved word in BrightScript and cannot be used as a variable or function name.',
    },
  },
  create: function (context) {
    return {
      // Check variable declarations
      VariableDeclarator: function (node) {
        if (node.id.type === 'Identifier') {
          const name = node.id.name;
          if (BRIGHTSCRIPT_RESERVED_WORDS.has(name.toLowerCase())) {
            context.report({
              node: node.id,
              messageId: 'reservedWordUsed',
              data: { word: name },
            });
          }
        }
      },

      // Check function declarations
      FunctionDeclaration: function (node) {
        if (node.id && BRIGHTSCRIPT_RESERVED_WORDS.has(node.id.name.toLowerCase())) {
          context.report({
            node: node.id,
            messageId: 'reservedWordUsed',
            data: { word: node.id.name },
          });
        }
      },


      // Check parameter names
      Identifier: function (node) {
        // Only check if this is a parameter (has a parent that is a function)
        if (node.parent && (
          node.parent.type === 'FunctionDeclaration' ||
          node.parent.type === 'FunctionExpression' ||
          node.parent.type === 'ArrowFunctionExpression'
        )) {
          // Check if this identifier is in the params array
          if (node.parent.params && node.parent.params.includes(node)) {
            if (BRIGHTSCRIPT_RESERVED_WORDS.has(node.name.toLowerCase())) {
              context.report({
                node,
                messageId: 'reservedWordUsed',
                data: { word: node.name },
              });
            }
          }
        }
      },
    };
  },
};

export default rule;
