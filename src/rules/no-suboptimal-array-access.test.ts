import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-suboptimal-array-access';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-suboptimal-array-access', () => {
  it('HS-1044: flags computed access on as any/unknown without type info', () => {
    ruleTester.run('no-suboptimal-array-access', rule, {
      valid: [
        'const key = "a"; const x = (view as SomeType)[key];',
        'const x = (view as any)["fixed"];',
        'const x = view[key];',
        'const x = (obj as { a: number }).foo;',
        'const key = "k"; const x = (node as unknown as Record<string, unknown>)[key];',
        'const key = "k"; const x = (node as unknown as Record<string, string>)[key];',
      ],
      invalid: [
        {
          code: 'const key = "k"; const x = (view as any)[key];',
          errors: [{ messageId: 'ambiguousAnyUnknownAccess' }],
        },
        {
          code: 'const key = "k"; const x = (view as unknown)[key];',
          errors: [{ messageId: 'ambiguousAnyUnknownAccess' }],
        },
        {
          code: 'const x = ((data as any))[id];',
          errors: [{ messageId: 'ambiguousAnyUnknownAccess' }],
        },
      ],
    });
  });

  it('without type info, non-HS-1044 cases are a no-op', () => {
    ruleTester.run('no-suboptimal-array-access', rule, {
      valid: [
        'const x = arr[0];',
        'const x = obj["key"];',
        'const x = arr[i];',
      ],
      invalid: [],
    });
  });
});
