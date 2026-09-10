import { describe, expect, it } from 'vitest';
import rule from './notification-handler-valid';
import { lintLifecycleRule } from '../__test__/lifecycle-rule-linter';

const prelude = `import { onNotification, INotification } from '@hs-src/hosanna-ui/lib/notification-api';`;

describe('notification-handler-valid', () => {
  it.each([
    ['one argument', 'class Screen { @onNotification("Changed") changed(notification: INotification) {} }'],
    ['unused optional argument', 'class Screen { @onNotification("Changed") changed(_notification?: INotification) {} }'],
    ['destructured argument', 'class Screen { @onNotification("Changed") changed({ name }: INotification) {} }'],
    ['erased this parameter', 'class Screen { @onNotification("Changed") changed(this: Screen, notification: INotification) {} }'],
    ['default after first runtime argument', 'class Screen { @onNotification("Changed") changed(notification: INotification, extra = 1) {} }'],
    ['rest after first runtime argument', 'class Screen { @onNotification("Changed") changed(notification: INotification, ...extra: unknown[]) {} }'],
    ['separate constructor and prototype targets', 'class Screen { @onNotification("Changed") changed(n: INotification) {} @onNotification("Changed") static changed(n: INotification) {} }'],
    ['different names', 'class Screen { @onNotification("Changed") changed(n: INotification) {} @onNotification("Other") other(n: INotification) {} }'],
    ['same name in different classes', 'class Screen { @onNotification("Changed") changed(n: INotification) {} } class Other { @onNotification("Changed") changed(n: INotification) {} }'],
    ['same name inherited by another class', 'class Screen { @onNotification("Changed") changed(n: INotification) {} } class Other extends Screen { @onNotification("Changed") other(n: INotification) {} }'],
    ['dynamic names are not guessed', 'declare let name: string; class Screen { @onNotification(name) first(n: INotification) {} @onNotification(name) second(n: INotification) {} }'],
    ['ordinary call', 'onNotification("Changed");'],
  ])('accepts %s', (_name, body) => {
    expect(lintLifecycleRule(rule, `${prelude}\n${body}`)).toEqual([]);
  });

  it.each([
    ['zero arguments', 'changed() {}', '0'],
    ['two arguments', 'changed(a: INotification, b: number) {}', '2'],
    ['optional second argument', 'changed(a: INotification, b?: number) {}', '2'],
    ['first parameter default', 'changed(n: INotification = { name: "Changed", data: undefined }) {}', '0'],
    ['rest-only parameter', 'changed(...notifications: INotification[]) {}', '0'],
    ['this-only parameter', 'changed(this: Screen) {}', '0'],
  ])('rejects %s with the runtime arity and correction', (_name, method, arity) => {
    const messages = lintLifecycleRule(rule, `${prelude}\nclass Screen { @onNotification("Changed") ${method} }`);
    expect(messages).toHaveLength(1);
    expect(messages[0].messageId).toBe('invalidArity');
    expect(messages[0].message).toContain(`this method has ${arity}`);
    expect(messages[0].message).toContain('@onNotification("Changed") method "changed"');
    expect(messages[0].message).toContain('Hosanna will throw during class initialization');
    expect(messages[0].message).toContain('handleChanged(notification: INotification<Payload>)');
  });

  it.each([
    ['literal', '"Changed"', '"Changed"'],
    ['template literal', '`Changed`', '"Changed"'],
    ['constant aliases', 'note', '"Changed"'],
  ])('rejects duplicate %s names within the class', (_name, first, second) => {
    const messages = lintLifecycleRule(rule, `${prelude} const note = "Changed"; class Screen { @onNotification(${first}) first(n: INotification) {} @onNotification(${second}) second(n: INotification) {} }`);
    expect(messages.map(message => message.messageId)).toEqual(['duplicateNotification']);
    expect(messages[0].message).toContain('Combine the work in one decorated method');
  });

  it.each([
    ['import alias', 'import { onNotification as notification } from "@hs-src/hosanna-ui/lib/notification-api";', 'notification'],
    ['namespace import', 'import * as notifications from "@hs-src/hosanna-ui/lib/notification-api";', 'notifications.onNotification'],
    ['re-export alias', 'import { notification } from "./notification-barrel";', 'notification'],
    ['local const alias', `${prelude} const notification = onNotification;`, 'notification'],
  ])('resolves the real decorator through %s', (_name, imports, decorator) => {
    const messages = lintLifecycleRule(rule, `${imports} class Screen { @${decorator}("Changed") changed() {} }`);
    expect(messages.map(message => message.messageId)).toEqual(['invalidArity']);
  });

  it('names the actual method and statically resolved notification in the diagnostic', () => {
    const messages = lintLifecycleRule(rule, `${prelude} const name = 'DeviceChanged'; class Screen { @onNotification(name) refreshDevice() {} }`);
    expect(messages.map(message => message.messageId)).toEqual(['invalidArity']);
    expect(messages[0].message).toContain('@onNotification("DeviceChanged") method "refreshDevice"');
  });

  it('rejects duplicate static handlers on the same constructor', () => {
    const messages = lintLifecycleRule(rule, `${prelude} class Screen { @onNotification("Changed") static first(n: INotification) {} @onNotification("Changed") static second(n: INotification) {} }`);
    expect(messages.map(message => message.messageId)).toEqual(['duplicateNotification']);
  });

  it('ignores a same-name decorator belonging to the application', () => {
    const messages = lintLifecycleRule(rule, 'function onNotification(name: string): (...args: any[]) => void { return () => {}; } class Screen { @onNotification("Changed") changed() {} @onNotification("Changed") other() {} }');
    expect(messages).toEqual([]);
  });

  it('ignores a parameter shadowing the real import', () => {
    const code = `${prelude} function factory(onNotification: (name: string) => (...args: any[]) => void) { return class Screen { @onNotification("Changed") changed() {} }; }`;
    expect(lintLifecycleRule(rule, code)).toEqual([]);
    expect(lintLifecycleRule(rule, code, false)).toEqual([]);
  });

  it('checks direct import aliases without a TypeScript project', () => {
    const messages = lintLifecycleRule(rule, 'import { onNotification as notification } from "@hs-src/hosanna-ui/lib/notification-api"; class Screen { @notification("Changed") changed() {} }', false);
    expect(messages.map(message => message.messageId)).toEqual(['invalidArity']);
  });
});
