import { describe, expect, it } from 'vitest';
import rule from './prefer-sort-by';
import { lintOwnershipBatching } from '../__test__/ownership-batching-rule-linter';

describe('prefer-sort-by', () => {
  it.each([
    ['typed array', `declare const items: Array<{ title: string }>; items.sort((left, right) => left.title.localeCompare(right.title));`],
    ['array literal', `[{ rank: 2 }, { rank: 1 }].sort((left, right) => left.rank - right.rank);`],
    ['computed sort property', `declare const items: number[]; items['sort']((left, right) => left - right);`],
  ])('warns for %s', (_name, code) => {
    const { messages, diagnostics } = lintOwnershipBatching(rule, code);

    expect(diagnostics()).toEqual([]);
    expect(messages).toHaveLength(1);
    expect(messages[0].severity).toBe(1);
    expect(messages[0].messageId).toBe('preferSortBy');
    expect(messages[0].message).toContain('large arrays');
    expect(messages[0].message).toContain('SortBy(fieldName, flags)');
    expect(messages[0].fix).toBeUndefined();
  });

  it.each([
    ['SortBy', `declare const items: { SortBy(fieldName: string, flags?: string): void }; items.SortBy('title', 'i');`],
    ['unrelated sort method', `declare const queue: { sort(): void }; queue.sort();`],
    ['unrelated method', `declare const items: number[]; items.reverse();`],
  ])('allows %s', (_name, code) => {
    const { messages, diagnostics } = lintOwnershipBatching(rule, code);

    expect(diagnostics()).toEqual([]);
    expect(messages).toEqual([]);
  });
});
