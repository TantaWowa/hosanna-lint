import { describe, expect, it } from 'vitest';
import noUnsupportedArrayMethods from './no-unsupported-array-methods';
import { lintOwnershipBatching } from '../__test__/ownership-batching-rule-linter';

describe('Array.SortBy support metadata', () => {
  it('allows the native method on array literals', () => {
    const source = `
      declare global {
        interface Array<T> {
          SortBy(fieldName: string, flags?: string): void;
        }
      }
      [{ rank: 2 }, { rank: 1 }].SortBy('rank', 'r');
    `;
    const { messages, diagnostics } = lintOwnershipBatching(noUnsupportedArrayMethods, source);

    expect(diagnostics()).toEqual([]);
    expect(messages).toEqual([]);
  });
});
