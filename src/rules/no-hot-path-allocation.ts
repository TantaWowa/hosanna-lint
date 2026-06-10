import { Rule } from 'eslint';
import type { Node } from 'estree';

/**
 * Enforces the Hs2d Performance Covenant (C2: zero steady-state allocation)
 * inside functions explicitly marked as hot paths with an `@hotPath` comment.
 * Within a hot function, every per-call allocation is flagged: object/array
 * literals, closures, `new` expressions, and template literals with
 * interpolations. Annotation-driven, so adoption is opt-in and precise —
 * mark frame-loop methods (update/render/sync) and the rule keeps them clean.
 */
const HOT_PATH_TAG = '@hotPath';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow per-call allocations (object/array literals, closures, new, interpolated templates) inside functions marked @hotPath',
      category: 'Performance',
      recommended: true,
    },
    schema: [],
    messages: {
      objectAllocation: 'Object literal allocates on every call of a @hotPath function. Preallocate it at build time and mutate fields instead.',
      arrayAllocation: 'Array literal allocates on every call of a @hotPath function. Preallocate it at build time and reuse it (set length = 0) instead.',
      closureAllocation: 'Closure allocates on every call of a @hotPath function (and BrightScript closure captures are fragile). Hoist it to a field assigned at construction time.',
      newAllocation: 'new expression allocates on every call of a @hotPath function. Preallocate at build time (Covenant C3: pools never create at frame time).',
      templateAllocation: 'Interpolated template literal builds a string on every call of a @hotPath function. Amortize string building to a once-per-second stats window (Covenant C8).',
    },
  },
  create: function (context) {
    const sourceCode = context.sourceCode;
    // depth > 0 while inside a @hotPath function but NOT inside a nested closure
    // (the closure itself is reported once; its body is the closure's problem).
    let hotDepth = 0;
    let nestedFunctionDepth = 0;

    function hasHotPathComment(node: Node & Rule.NodeParentExtension): boolean {
      const target = node.parent && (node.parent.type === 'MethodDefinition' || node.parent.type === 'Property' || node.parent.type === 'VariableDeclarator')
        ? (node.parent.type === 'VariableDeclarator' && node.parent.parent ? node.parent.parent : node.parent)
        : node;
      const comments = sourceCode.getCommentsBefore(target as Node);
      for (let i = 0; i < comments.length; i++) {
        if (comments[i].value.indexOf(HOT_PATH_TAG) >= 0) {
          return true;
        }
      }
      return false;
    }

    function enterFunction(node: Node & Rule.NodeParentExtension): void {
      if (hotDepth > 0) {
        // a function created inside a hot path is itself an allocation
        if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') {
          if (nestedFunctionDepth === 0) {
            context.report({ node, messageId: 'closureAllocation' });
          }
          nestedFunctionDepth++;
          return;
        }
      }
      if (hasHotPathComment(node)) {
        hotDepth++;
      }
    }

    function exitFunction(node: Node & Rule.NodeParentExtension): void {
      if (hotDepth > 0 && (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') && nestedFunctionDepth > 0) {
        nestedFunctionDepth--;
        return;
      }
      if (hasHotPathComment(node)) {
        hotDepth--;
      }
    }

    function isReportable(): boolean {
      return hotDepth > 0 && nestedFunctionDepth === 0;
    }

    return {
      FunctionDeclaration: enterFunction,
      'FunctionDeclaration:exit': exitFunction,
      FunctionExpression: enterFunction,
      'FunctionExpression:exit': exitFunction,
      ArrowFunctionExpression: enterFunction,
      'ArrowFunctionExpression:exit': exitFunction,
      ObjectExpression: function (node) {
        if (isReportable()) {
          context.report({ node, messageId: 'objectAllocation' });
        }
      },
      ArrayExpression: function (node) {
        if (isReportable()) {
          context.report({ node, messageId: 'arrayAllocation' });
        }
      },
      NewExpression: function (node) {
        if (isReportable()) {
          context.report({ node, messageId: 'newAllocation' });
        }
      },
      TemplateLiteral: function (node) {
        if (isReportable() && node.expressions.length > 0) {
          context.report({ node, messageId: 'templateAllocation' });
        }
      },
    };
  },
};

export default rule;
