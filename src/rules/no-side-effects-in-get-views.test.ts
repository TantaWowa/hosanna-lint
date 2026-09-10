import { describe, expect, it } from 'vitest';
import rule from './no-side-effects-in-get-views';
import { lintGetViewsEffects } from '../__test__/get-views-side-effects-linter';

const screen = (body: string, helpers = '') => `class CardView extends BaseView { protected override getViews() { ${body} return []; } ${helpers} }`;

describe('no-side-effects-in-get-views', () => {
  it.each([
    ['notification subscription', 'center.subscribe("Changed", () => {});', 'notificationSubscription', 'notificationCenter.subscribe()'],
    ['notification dispatch', 'center.dispatch({ name: "Changed" });', 'notificationDispatch', 'notificationCenter.dispatch()'],
    ['concrete center', 'concreteCenter.subscribe("Changed", () => {});', 'notificationSubscription', 'notificationCenter.subscribe()'],
    ['injected center', 'this.notificationCenter.subscribe("Changed", () => {});', 'notificationSubscription', 'notificationCenter.subscribe()'],
    ['observable registration', 'observable.addObserver("value", this, () => {});', 'observer', 'HsObservable.addObserver()'],
    ['timer service timeout', 'timers.setTimeout(() => {}, 100);', 'timer', 'TimerService.setTimeout()'],
    ['timer service interval', 'timers.setInterval(() => {}, 100);', 'timer', 'TimerService.setInterval()'],
    ['timer service timer', 'timers.setTimer(() => {}, 100, true);', 'timer', 'TimerService.setTimer()'],
    ['tickable registration', 'timers.registerTickable(this);', 'tickable', 'TimerService.registerTickable()'],
    ['global timeout', 'setTimeout(() => {}, 100);', 'timer', 'setTimeout()'],
    ['global interval', 'setInterval(() => {}, 100);', 'timer', 'setInterval()'],
    ['window timeout', 'window.setTimeout(() => {}, 100);', 'timer', 'setTimeout()'],
    ['globalThis interval', 'globalThis.setInterval(() => {}, 100);', 'timer', 'setInterval()'],
    ['animation frame', 'requestAnimationFrame(() => {});', 'timer', 'requestAnimationFrame()'],
    ['idle callback', 'requestIdleCallback(() => {});', 'timer', 'requestIdleCallback()'],
    ['DOM registration', 'document.addEventListener("click", () => {});', 'domListener', 'addEventListener()'],
    ['global event registration', 'addEventListener("resize", () => {});', 'domListener', 'addEventListener()'],
    ['EventTarget registration', 'new EventTarget().addEventListener("change", () => {});', 'domListener', 'addEventListener()'],
    ['live view state', 'this.setState({ title: "Hello" });', 'state', 'BaseView.setState()'],
    ['another live view', 'anotherView.setState({ title: "Hello" });', 'state', 'BaseView.setState()'],
    ['optional method call', 'center?.subscribe?.("Changed", () => {});', 'notificationSubscription', 'notificationCenter.subscribe()'],
    ['computed method call', 'center["dispatch"]({ name: "Changed" });', 'notificationDispatch', 'notificationCenter.dispatch()'],
    ['API method alias', 'const subscribe = center.subscribe; subscribe("Changed", () => {});', 'notificationSubscription', 'notificationCenter.subscribe()'],
  ])('reports %s using real API provenance', (_name, body, messageId, api) => {
    const messages = lintGetViewsEffects(rule, screen(body));
    expect(messages.map(message => message.messageId)).toEqual([messageId]);
    expect(messages[0].message).toContain(api);
    expect(messages[0].message).toContain('getViews()');
    expect(messages[0].message).toContain('rebuild');
    expect(messages[0].severity).toBe(2);
    expect(messages[0].fix).toBeUndefined();
  });

  it.each([
    ['same-class helper', screen('this.start();', 'private start() { timers.setTimeout(() => {}); }')],
    ['helper chain', screen('this.first();', 'private first() { this.second(); } private second() { timers.setTimeout(() => {}); }')],
    ['helper before its declaration', screen('this["start"]();', 'private start() { timers.setTimeout(() => {}); }')],
    ['arrow helper property', screen('this.start();', 'private start = () => { timers.setTimeout(() => {}); };')],
    ['synchronous arrow IIFE', screen('(() => { timers.setTimeout(() => {}); })();')],
    ['synchronous function IIFE', screen('(function run() { timers.setTimeout(() => {}); })();')],
    ['array map', screen('[1, 2].map(() => { timers.setTimeout(() => {}); return new ViewStruct(); });')],
    ['array forEach', screen('[1].forEach(() => { timers.setTimeout(() => {}); });')],
    ['readonly array map', screen('const items: readonly number[] = [1]; items.map(() => { timers.setTimeout(() => {}); return 1; });')],
    ['Array.from mapper', screen('Array.from([1], () => { timers.setTimeout(() => {}); return 1; });')],
    ['array callback helper reference', screen('[1].forEach(this.start);', 'private start() { timers.setTimeout(() => {}); }')],
    ['bound array callback helper', screen('[1].forEach(this.start.bind(this));', 'private start() { timers.setTimeout(() => {}); }')],
    ['local named array callback', screen('function start() { timers.setTimeout(() => {}); } [1].forEach(start);')],
    ['local arrow array callback', screen('const start = () => { timers.setTimeout(() => {}); }; [1].forEach(start);')],
    ['helper inside array callback', screen('[1].map(() => this.start());', 'private start() { timers.setTimeout(() => {}); return new ViewStruct(); }')],
    ['immediate event argument', screen('new ViewStruct().onClick(this.start());', 'private start() { timers.setTimeout(() => {}); return () => {}; }')],
    ['helper also used by deferred callback', screen('new ViewStruct().onClick(() => this.start()); this.start();', 'private start() { timers.setTimeout(() => {}); }')],
  ])('follows %s synchronously', (_name, code) => {
    expect(lintGetViewsEffects(rule, code).map(message => message.messageId)).toEqual(['timer']);
  });

  it.each([
    ['local array mutation', screen('const views: ViewStruct[] = []; views.push(new ViewStruct()); views.splice(0, 1);')],
    ['ViewStruct state builder', screen('new ViewStruct().setState({ title: "Ready" });')],
    ['pure factory', 'function createCard() { return new ViewStruct(); }' + screen('createCard();')],
    ['pure class factory', screen('this.createCard();', 'private createCard() { return new ViewStruct().setState({ title: "Ready" }); }')],
    ['deferred onClick', screen('new ViewStruct().onClick(() => center.dispatch({ name: "Changed" }));')],
    ['deferred onInputEvent', screen('new ViewStruct().onInputEvent(() => this.setState({ active: true }));')],
    ['deferred helper reference', screen('new ViewStruct().onClick(this.start);', 'private start() { timers.setTimeout(() => {}); }')],
    ['deferred helper call', screen('new ViewStruct().onClick(() => this.start());', 'private start() { timers.setTimeout(() => {}); }')],
    ['deferred handlers created inside map', screen('[1].map(() => new ViewStruct().onClick(() => center.dispatch({ name: "Changed" })));')],
    ['unused local callback', screen('const later = () => timers.setTimeout(() => {});')],
    ['unused method', screen('', 'private unused() { timers.setTimeout(() => {}); }')],
    ['ordinary lifecycle method', 'class CardView extends BaseView { onMount() { center.subscribe("Changed", () => {}); } }'],
    ['namesake view', 'import { BaseView as Other } from "./namesakes"; class CardView extends Other { protected override getViews() { setTimeout(() => {}); return []; } }'],
    ['unrelated getViews', 'class Renderer { getViews() { center.dispatch({ name: "Changed" }); return []; } }'],
    ['static getViews', 'class CardView extends BaseView { static getViews() { timers.setTimeout(() => {}); return []; } }'],
    ['namesake center', 'import { NotificationCenter as Other } from "./namesakes"; const other = new Other();' + screen('other.subscribe("Changed", () => {}); other.dispatch({});')],
    ['namesake timer', 'import { TimerService as Other } from "./namesakes"; const other = new Other();' + screen('other.setTimeout(() => {}); other.registerTickable(this);')],
    ['namesake observable', 'import { HsObservable as Other } from "./namesakes"; const other = new Other();' + screen('other.addObserver("x", this, () => {});')],
    ['shadowed timer global', 'function setTimeout(callback: () => void) {}' + screen('setTimeout(() => {});')],
    ['namesake DOM target', screen('const target = { addEventListener(name: string, callback: () => void) {} }; target.addEventListener("x", () => {});')],
    ['unknown custom map', screen('const source = { map(callback: () => void) {} }; source.map(() => timers.setTimeout(() => {}));')],
    ['deferred promise callback', screen('Promise.resolve().then(() => timers.setTimeout(() => {}));')],
    ['generator IIFE is not executed', screen('(function* () { timers.setTimeout(() => {}); })();')],
    ['generator helper is not executed', screen('this.start();', 'private *start() { timers.setTimeout(() => {}); }')],
    ['generator array callback is not executed', screen('[1].map(function* () { timers.setTimeout(() => {}); });')],
    ['async helper beyond scope', screen('this.start();', 'private async start() { await Promise.resolve(); timers.setTimeout(() => {}); }')],
    ['external factory beyond bounded analysis', 'function external() { timers.setTimeout(() => {}); return []; }' + screen('external();')],
  ])('allows %s without guessing purity', (_name, code) => {
    expect(lintGetViewsEffects(rule, code)).toEqual([]);
  });

  it('resolves actual view ancestry and API imports through aliases and a barrel', () => {
    const code = 'import { FrameworkView, Center } from "./barrel"; abstract class Shared extends FrameworkView {} class CardView extends Shared { protected override getViews() { new Center().dispatch({ name: "Changed" }); return []; } }';
    expect(lintGetViewsEffects(rule, code).map(message => message.messageId)).toEqual(['notificationDispatch']);
  });

  it('checks a getViews arrow override on an anonymous derived class', () => {
    expect(lintGetViewsEffects(rule, 'const Card = class extends BaseView { protected getViews = () => { this.setState({ title: "Ready" }); return []; }; };')
      .map(message => message.messageId)).toEqual(['state']);
  });

  it.each([
    'class CardView extends BaseView { protected ["getViews"]() { this.setState({}); return []; } }',
    'class CardView extends BaseView { protected getViews = function() { center.dispatch({ name: "Changed" }); return []; }; }',
  ])('checks alternate override syntax: %s', code => {
    expect(lintGetViewsEffects(rule, code)).toHaveLength(1);
  });

  it('reports one source location when a helper is called twice or recursively', () => {
    const code = screen('this.start(); this.start();', 'private start() { timers.setTimeout(() => {}); this.start(); }');
    const messages = lintGetViewsEffects(rule, code);
    expect(messages.map(message => message.messageId)).toEqual(['timer']);
    expect(messages[0].column).toBeGreaterThan(code.indexOf('timers.setTimeout'));
  });

  it('does not execute the body of a timer callback during the declaration pass', () => {
    const messages = lintGetViewsEffects(rule, screen('setTimeout(() => { center.dispatch({ name: "Later" }); this.setState({ ready: true }); });'));
    expect(messages.map(message => message.messageId)).toEqual(['timer']);
  });

  it('bounds synchronous helper traversal at eight calls', () => {
    const helpers = Array.from({ length: 9 }, (_, i) => `private step${i}() { ${i === 8 ? 'timers.setTimeout(() => {});' : `this.step${i + 1}();`} }`).join('\n');
    expect(lintGetViewsEffects(rule, screen('this.step0();', helpers))).toEqual([]);
  });

  it('revisits a shared helper reached later by a shorter call chain', () => {
    const helpers = Array.from({ length: 9 }, (_, i) => `private step${i}() { ${i === 8 ? 'timers.setTimeout(() => {});' : `this.step${i + 1}();`} }`).join('\n');
    expect(lintGetViewsEffects(rule, screen('this.step0(); this.step7();', helpers)).map(message => message.messageId)).toEqual(['timer']);
  });

  it('provides the exact lifecycle cleanup and event alternatives', () => {
    const messages = lintGetViewsEffects(rule, screen('timers.setInterval(() => {}); center.subscribe("Changed", () => {}); this.setState({ ready: true });'));
    expect(messages[0].message).toContain('timerService.clearInterval(id)');
    expect(messages[1].message).toContain('unsubscribe(name, handle)');
    expect(messages[1].message).toContain('ViewPhase.Mounted');
    expect(messages[2].message).toContain('returned ViewStruct');
    expect(messages[2].message).toContain('deferred .onClick/.onInputEvent');
  });

  it('skips safely without TypeScript type information', () => {
    expect(lintGetViewsEffects(rule, screen('this.setState({ ready: true }); setTimeout(() => {});'), false)).toEqual([]);
  });
});
