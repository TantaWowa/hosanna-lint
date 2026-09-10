import { describe, expect, it } from 'vitest';
import rule from './no-fresh-callback-in-unsubscribe';
import { lintLifecycleRule } from '../__test__/lifecycle-rule-linter';

const prelude = `
  import { INotificationCenter as Center } from '@hs-src/hosanna-ui/lib/notification-api';
  import { NotificationCenter } from '@hs-src/hosanna-ui/lib/NotificationCenter';
  import { CollectionViewDataSource as Source } from '@hs-src/hosanna-list/CollectionViewDataSource';
  declare const center: Center;
  declare const concreteCenter: NotificationCenter;
  declare const source: Source;
  declare const owner: object;
  function handle(_notification: unknown): void {}
  function changed(_changes: unknown[]): void {}
`;

describe('no-fresh-callback-in-unsubscribe', () => {
  it.each([
    ['notification arrow', 'center.unsubscribe("Changed", () => {});', 'freshNotificationCallback'],
    ['notification anonymous function', 'center.unsubscribe("Changed", function() {});', 'freshNotificationCallback'],
    ['notification named function expression', 'center.unsubscribe("Changed", function callback() {});', 'freshNotificationCallback'],
    ['notification fresh bind', 'center.unsubscribe("Changed", handle.bind(owner));', 'freshNotificationCallback'],
    ['notification computed bind', 'center.unsubscribe("Changed", handle["bind"](owner));', 'freshNotificationCallback'],
    ['notification optional call', 'center?.unsubscribe?.("Changed", () => {});', 'freshNotificationCallback'],
    ['notification computed method', 'center["unsubscribe"]("Changed", () => {});', 'freshNotificationCallback'],
    ['concrete notification class', 'concreteCenter.unsubscribe("Changed", () => {});', 'freshNotificationCallback'],
    ['notification method alias', 'const unsubscribe = center.unsubscribe; unsubscribe("Changed", () => {});', 'freshNotificationCallback'],
    ['assertion wrapper', 'center.unsubscribe("Changed", (() => {}) as typeof handle);', 'freshNotificationCallback'],
    ['data source arrow', 'source.removeOnDataSourceChanged(() => {});', 'freshDataSourceCallback'],
    ['data source anonymous function', 'source.removeOnDataSourceChanged(function() {});', 'freshDataSourceCallback'],
    ['data source fresh bind', 'source.removeOnDataSourceChanged(changed.bind(owner));', 'freshDataSourceCallback'],
    ['data source method alias', 'const remove = source.removeOnDataSourceChanged; remove(() => {});', 'freshDataSourceCallback'],
  ])('rejects %s', (_name, body, messageId) => {
    const messages = lintLifecycleRule(rule, `${prelude}\n${body}`);
    expect(messages.map(message => message.messageId)).toEqual([messageId]);
    expect(messages[0].message).toContain('callback');
    expect(messages[0].message).toContain('during owner teardown');
  });

  it.each([
    ['saved handler', 'center.unsubscribe("Changed", handle);'],
    ['subscription return value', 'const saved = center.subscribe("Changed", handle.bind(owner)); center.unsubscribe("Changed", saved);'],
    ['bound handler retained once', 'const saved = changed.bind(owner); source.onDataSourceChanged(saved); source.removeOnDataSourceChanged(saved);'],
    ['subscription arrow', 'center.subscribe("Changed", () => {});'],
    ['subscription bind', 'center.subscribe("Changed", handle.bind(owner));'],
    ['data source registration', 'source.onDataSourceChanged(changed.bind(owner));'],
    ['ordinary callback argument', 'function run(callback: () => void) {} run(() => {});'],
    ['unrelated unsubscribe method', 'const other = { unsubscribe(name: string, callback: () => void) {} }; other.unsubscribe("Changed", () => {});'],
    ['unrelated removal method', 'const other = { removeOnDataSourceChanged(callback: () => void) {} }; other.removeOnDataSourceChanged(() => {});'],
    ['unrelated namesake interface', 'interface INotificationCenter { unsubscribe(name: string, callback: () => void): void } declare const other: INotificationCenter; other.unsubscribe("Changed", () => {});'],
    ['custom bind factory returns retained callback', 'const registry = { bind(owner: object) { return handle; } }; center.unsubscribe("Changed", registry.bind(owner));'],
    ['callback in notification name position', 'center.unsubscribe((() => {}) as unknown as string, handle);'],
  ])('accepts %s', (_name, body) => {
    expect(lintLifecycleRule(rule, `${prelude}\n${body}`)).toEqual([]);
  });

  it('resolves the notification interface through a re-export alias', () => {
    const messages = lintLifecycleRule(rule, 'import { Center } from "./notification-barrel"; declare const center: Center; center.unsubscribe("Changed", () => {});');
    expect(messages.map(message => message.messageId)).toEqual(['freshNotificationCallback']);
  });

  it('does not guess API identity without type information', () => {
    expect(lintLifecycleRule(rule, `${prelude}\ncenter.unsubscribe("Changed", () => {});`, false)).toEqual([]);
  });
});
