import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-interface-computed-property';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-interface-computed-property', () => {
  it('should pass interfaces with regular properties', () => {
    ruleTester.run('no-interface-computed-property', rule, {
      valid: [
        'interface IExample { myField: string; }',
        'interface IExample { name: string; age: number; }',
      ],
      invalid: [],
    });
  });

  it('should report computed properties in interfaces', () => {
    ruleTester.run('no-interface-computed-property', rule, {
      valid: [],
      invalid: [
        {
          code: 'enum MyEnum { Key = "key" } interface IExample { [MyEnum.Key]: string; }',
          errors: [{ messageId: 'interfaceComputedPropertyNotAllowed' }],
        },
      ],
    });
  });
});
