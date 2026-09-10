import { describe, it, expect } from 'vitest';
import rule from './batch-data-source-updates';
import { lintOwnershipBatching } from '../__test__/ownership-batching-rule-linter';

const prelude = `declare const source: CollectionViewDataSource; declare const items: IIdentifiable[]; declare const rowId: string;`;
const mutate = 'source.updateItem(rowId, i, items[i]);';
const invalid = [
  ['for loop', `for (let i = 0; i < items.length; i++) { ${mutate} source.applyUpdates(); }`],
  ['for of', 'for (const item of items) { source.appendItemsToRow(rowId, [item]); source.applyUpdates(); }'],
  ['while loop', `let i = 0; while (i < items.length) { ${mutate} source.applyUpdates(); i++; }`],
  ['do loop', `let i = 0; do { ${mutate} source.applyUpdates(); i++; } while (i < items.length);`],
  ['sync forEach', 'items.forEach((item, i) => { source.updateItem(rowId, i, item); source.applyUpdates(); });'],
  ['sync map', 'items.map((item, i) => { source.updateItem(rowId, i, item); source.applyUpdates(); return item; });'],
  ['applyNow true', 'for (let i = 0; i < items.length; i++) source.updateItem(rowId, i, items[i], true);'],
  ['append immediate', 'for (const item of items) source.appendItemsToRow(rowId, [item], true);'],
  ['insert immediate', 'for (const item of items) source.insertItemsToRow(rowId, [item], 0, true);'],
  ['remove immediate', 'for (const item of items) source.removeItemsFromRow(rowId, 0, 1, true);'],
  ['loaded immediate', 'for (const item of items) source.addLoadedItemsToRow(rowId, [item], true);'],
  ['row immediate correct position', 'for (const item of items) source.appendRows([], undefined, true);'],
  ['row config default immediate', 'for (const item of items) source.UpdateRowConfiguration({}, {});'],
  ['const receiver alias', `const alias = source; for (let i = 0; i < items.length; i++) { ${mutate} alias.applyUpdates(); }`],
  ['stable field', 'class Updates { constructor(private source: CollectionViewDataSource) {} run() { for (const item of items) { this.source.appendItemsToRow(rowId, [item]); this.source.applyUpdates(); } } }'],
  ['computed methods', 'for (const item of items) { source["appendItemsToRow"](rowId, [item]); source["applyUpdates"](); }'],
  ['reexport alias', 'import { Source } from "./barrel"; declare const imported: Source; for (const item of items) { imported.appendItemsToRow(rowId, [item]); imported.applyUpdates(); }'],
  ['inherited canonical method', 'class Child extends CollectionViewDataSource {} declare const inherited: Child; for (const item of items) inherited.appendItemsToRow(rowId, [item], true);'],
] as const;
const valid = [
  ['flush after loop', `for (let i = 0; i < items.length; i++) { ${mutate} } source.applyUpdates();`],
  ['explicit queue', 'for (const item of items) source.appendItemsToRow(rowId, [item], false); source.applyUpdates();'],
  ['different source', `declare const other: CollectionViewDataSource; for (let i = 0; i < items.length; i++) { ${mutate} other.applyUpdates(); }`],
  ['no pending mutation', 'for (const item of items) source.applyUpdates();'],
  ['chunked flush', `for (let i = 0; i < items.length; i++) { ${mutate} if (i % 10 === 0) source.applyUpdates(); }`],
  ['checkpoint call', `declare function checkpoint(): void; for (let i = 0; i < items.length; i++) { ${mutate} checkpoint(); source.applyUpdates(); }`],
  ['conditional immediate', 'for (const item of items) { if (item.id === rowId) source.appendItemsToRow(rowId, [item], true); }'],
  ['different source each iteration', 'declare const sources: CollectionViewDataSource[]; for (const current of sources) { current.appendItemsToRow(rowId, items); current.applyUpdates(); }'],
  ['changing receiver', 'let current = source; declare function next(): CollectionViewDataSource; for (const item of items) { current = next(); current.appendItemsToRow(rowId, [item]); current.applyUpdates(); }'],
  ['destructured changing receiver', 'let current = source; for (const item of items) { ({ current } = { current: new CollectionViewDataSource([]) }); current.appendItemsToRow(rowId, [item]); current.applyUpdates(); }'],
  ['array destructured receiver', 'let current = source; for (const item of items) { [current] = [new CollectionViewDataSource([])]; current.appendItemsToRow(rowId, [item]); current.applyUpdates(); }'],
  ['assignment iteration receiver', 'let current = source; declare const sources: CollectionViewDataSource[]; for (current of sources) { current.appendItemsToRow(rowId, items); current.applyUpdates(); }'],
  ['changed field receiver', 'class Owner { constructor(private source: CollectionViewDataSource) {} run() { for (const item of items) { this.source = new CollectionViewDataSource([]); this.source.appendItemsToRow(rowId, [item]); this.source.applyUpdates(); } } }'],
  ['source allocated per iteration', 'for (const item of items) { const current = new CollectionViewDataSource([]); current.appendItemsToRow(rowId, [item]); current.applyUpdates(); }'],
  ['deferred callback', 'declare function defer(callback: () => void): void; for (const item of items) defer(() => { source.appendItemsToRow(rowId, [item]); source.applyUpdates(); });'],
  ['async iteration', 'items.forEach(async item => { source.appendItemsToRow(rowId, [item]); source.applyUpdates(); });'],
  ['await in loop', 'async function run() { for (const item of items) { source.appendItemsToRow(rowId, [item]); await Promise.resolve(); source.applyUpdates(); } }'],
  ['for await', 'async function run() { for await (const item of items) { source.appendItemsToRow(rowId, [item]); source.applyUpdates(); } }'],
  ['unrelated methods', 'const other = { updateItem(...args: unknown[]) {}, applyUpdates() {} }; for (const item of items) { other.updateItem(item); other.applyUpdates(); }'],
  ['custom forEach may defer', 'declare const custom: { forEach(callback: () => void): void }; custom.forEach(() => { source.appendItemsToRow(rowId, items); source.applyUpdates(); });'],
  ['overridden API', 'class Custom extends CollectionViewDataSource { applyUpdates(): void {} } declare const custom: Custom; for (const item of items) { custom.appendItemsToRow(rowId, [item]); custom.applyUpdates(); }'],
  ['dynamic applyNow', 'declare const immediate: boolean; for (const item of items) source.appendItemsToRow(rowId, [item], immediate);'],
  ['getter source', 'class Owner { get source(): CollectionViewDataSource { return source; } run() { for (const item of items) { this.source.appendItemsToRow(rowId, [item]); this.source.applyUpdates(); } } }'],
  ['outside loop', 'source.appendItemsToRow(rowId, items); source.applyUpdates();'],
] as const;
describe('batch-data-source-updates', () => {
  it.each(invalid)('warns for %s', (_name, code) => {
    const { messages, diagnostics } = lintOwnershipBatching(rule, prelude + code);
    expect(diagnostics()).toEqual([]);
    expect(messages).toHaveLength(1);
    expect(messages[0].severity).toBe(1);
    expect(messages[0].messageId).toBe('perIteration');
    expect(messages[0].message).toContain('applyNow false');
    expect(messages[0].message).toContain('once after the loop');
    expect(messages[0].fix).toBeUndefined();
  });
  it.each(valid)('allows %s', (_name, code) => {
    const { messages, diagnostics } = lintOwnershipBatching(rule, prelude + code);
    expect(diagnostics()).toEqual([]);
    expect(messages).toEqual([]);
  });
  it('skips when API provenance is unavailable', () => expect(lintOwnershipBatching(rule, prelude + invalid[0][1], false).messages).toEqual([]));
});
