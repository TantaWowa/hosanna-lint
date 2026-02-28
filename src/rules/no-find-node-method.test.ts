import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-find-node-method';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-find-node-method', () => {
  it('should pass the findNode utility function call', () => {
    ruleTester.run('no-find-node-method', rule, {
      valid: [
        'findNode(node, "myId");',
        'const result = findNode(tree, id);',
      ],
      invalid: [],
    });
  });

  it('should report direct .findNode() usage', () => {
    ruleTester.run('no-find-node-method', rule, {
      valid: [],
      invalid: [
        {
          code: 'node.findNode("myId");',
          errors: [{ messageId: 'avoidFindNode' }],
        },
        {
          code: 'this.top.findNode("contentArea");',
          errors: [{ messageId: 'avoidFindNode' }],
        },
      ],
    });
  });
});
