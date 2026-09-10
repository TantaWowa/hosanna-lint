import { describe, it, expect } from 'vitest';
import rule from './subscription-cleanup';
import { lintOwnershipBatching, ownershipImports } from '../__test__/ownership-batching-rule-linter';

const fields = `
  @inject() center!: INotificationCenter;
  @inject() otherCenter!: INotificationCenter;
  @inject() source!: CollectionViewDataSource;
  @inject() otherSource!: CollectionViewDataSource;
  subscription?: IIdentifiable;
  otherSubscription?: IIdentifiable;
  changed(_notification: INotification): void {}
  dataChanged(_changes: IDataSourceChange[]): void {}
  boundDataChanged = this.dataChanged.bind(this);
`;
const view = (body: string) => `class Screen extends BaseView { ${fields} ${body} }`;
const invalid = [
  ['phase-owned registration with presentation cleanup only', view('onViewPhaseChange(phase: ViewPhase) { if (phase === ViewPhase.Mounted) this.start(); } onAppear() { this.start(); } start() { this.subscription = this.center.subscribe("Changed", this.changed); } onDisappear() { this.center.unsubscribe("Changed", this.subscription!); }'), 'missingCleanup'],
  ['mount-owned registration with presentation cleanup only', view('onMount() { this.start(); } onAppear() { this.start(); } start() { this.subscription = this.center.subscribe("Changed", this.changed); } onDisappear() { this.center.unsubscribe("Changed", this.subscription!); }'), 'missingCleanup'],
  ['constructor-owned registration with presentation cleanup only', view('constructor() { super(); this.start(); } onAppear() { this.start(); } start() { this.subscription = this.center.subscribe("Changed", this.changed); } onDisappear() { this.center.unsubscribe("Changed", this.subscription!); }'), 'missingCleanup'],
  ['configure-owned registration with presentation cleanup only', view('onConfigure() { this.start(); } onAppear() { this.start(); } start() { this.subscription = this.center.subscribe("Changed", this.changed); } onDisappear() { this.center.unsubscribe("Changed", this.subscription!); }'), 'missingCleanup'],
  ['arbitrary hiding hook is not framework cleanup', view('onAppear() { this.subscription = this.center.subscribe("Changed", this.changed); } onHide() { this.center.unsubscribe("Changed", this.subscription!); }'), 'missingCleanup'],
  ['unused presentation cleanup helper', view('onAppear() { this.subscription = this.center.subscribe("Changed", this.changed); } stop() { this.center.unsubscribe("Changed", this.subscription!); }'), 'missingCleanup'],
  ['presentation cleanup after return', view('onAppear() { this.subscription = this.center.subscribe("Changed", this.changed); } onDisappear() { return; this.center.unsubscribe("Changed", this.subscription!); }'), 'missingCleanup'],
  ['presentation cleanup false parameter branch', view('onAppear() { this.subscription = this.center.subscribe("Changed", this.changed); } onDisappear() { this.stop(false); } stop(active: boolean) { if (active) this.center.unsubscribe("Changed", this.subscription!); }'), 'missingCleanup'],
  ['wrong presentation notification', view('onAppear() { this.subscription = this.center.subscribe("Changed", this.changed); } onDisappear() { this.center.unsubscribe("Other", this.subscription!); }'), 'missingCleanup'],
  ['phase removal only during Mounted', view('onMount() { this.subscription = this.center.subscribe("Changed", this.changed); } onViewPhaseChange(phase: ViewPhase) { if (phase === ViewPhase.Mounted) this.center.unsubscribe("Changed", this.subscription!); }'), 'missingCleanup'],
  ['phase dispatcher suppressed by onUnmount override', view('onViewPhaseChange(phase: ViewPhase) { if (phase === ViewPhase.Mounted) this.subscription = this.center.subscribe("Changed", this.changed); else this.center.unsubscribe("Changed", this.subscription!); } onUnmount() {}'), 'missingCleanup'],
  ['phase switch removal only during Mounted', view('onMount() { this.subscription = this.center.subscribe("Changed", this.changed); } onViewPhaseChange(phase: ViewPhase) { switch (phase) { case ViewPhase.Mounted: this.center.unsubscribe("Changed", this.subscription!); break; } }'), 'missingCleanup'],
  ['discarded bind', view('onMount() { this.center.subscribe("Changed", this.changed.bind(this)); }'), 'lostIdentity'],
  ['discarded arrow', view('onMount() { this.center.subscribe("Changed", notification => this.changed(notification)); }'), 'lostIdentity'],
  ['retained token without cleanup', view('onMount() { this.subscription = this.center.subscribe("Changed", this.changed.bind(this)); }'), 'missingCleanup'],
  ['stable handler without cleanup', view('onMount() { this.center.subscribe("Changed", this.changed); }'), 'missingCleanup'],
  ['uncalled stop', view('onMount() { this.subscription = this.center.subscribe("Changed", this.changed); } stop() { this.center.unsubscribe("Changed", this.subscription!); }'), 'missingCleanup'],
  ['wrong notification', view('onMount() { this.subscription = this.center.subscribe("Changed", this.changed); } onUnmount() { this.center.unsubscribe("Other", this.subscription!); }'), 'missingCleanup'],
  ['wrong center', view('onMount() { this.subscription = this.center.subscribe("Changed", this.changed); } onUnmount() { this.otherCenter.unsubscribe("Changed", this.subscription!); }'), 'missingCleanup'],
  ['wrong token', view('onMount() { this.subscription = this.center.subscribe("Changed", this.changed); } onUnmount() { this.center.unsubscribe("Changed", this.otherSubscription!); }'), 'missingCleanup'],
  ['unreachable stop after return', view('onMount() { this.center.subscribe("Changed", this.changed); } release() { return; this.stop(); } stop() { this.center.unsubscribe("Changed", this.changed); }'), 'missingCleanup'],
  ['unreachable stop after throw', view('onMount() { this.center.subscribe(\"Changed\", this.changed); } release() { throw new Error(); this.stop(); } stop() { this.center.unsubscribe(\"Changed\", this.changed); }'), 'missingCleanup'],
  ['false cleanup branch', view('onMount() { this.center.subscribe("Changed", this.changed); } release() { if (false) this.center.unsubscribe("Changed", this.changed); }'), 'missingCleanup'],
  ['deferred cleanup', view('onMount() { this.center.subscribe("Changed", this.changed); } release() { setTimeout(() => this.center.unsubscribe("Changed", this.changed)); }'), 'missingCleanup'],
  ['datasource discarded bind', view('onMount() { this.source.onDataSourceChanged(this.dataChanged.bind(this)); }'), 'lostIdentity'],
  ['datasource retained callback no cleanup', view('onMount() { this.source.onDataSourceChanged(this.boundDataChanged); }'), 'missingCleanup'],
  ['datasource wrong receiver', view('onMount() { this.source.onDataSourceChanged(this.boundDataChanged); } onUnmount() { this.otherSource.removeOnDataSourceChanged(this.boundDataChanged); }'), 'missingCleanup'],
  ['datasource fresh removal identity', view('onMount() { this.source.onDataSourceChanged(this.boundDataChanged); } onUnmount() { this.source.removeOnDataSourceChanged(this.dataChanged.bind(this)); }'), 'missingCleanup'],
  ['external constructor property', 'class Screen extends BaseView { constructor(private center: INotificationCenter) { super(); this.center.subscribe("Changed", () => {}); } }', 'lostIdentity'],
  ['external constructor assignment', 'class Screen extends BaseView { private center: INotificationCenter; constructor(center: INotificationCenter) { super(); this.center = center; this.center.subscribe("Changed", () => {}); } }', 'lostIdentity'],
  ['resolved external center', 'class Screen extends BaseView { private center = AppUtils.resolve<INotificationCenter>("notificationCenter"); onMount() { this.center.subscribe("Changed", () => {}); } }', 'lostIdentity'],
  ['supplementary missing release cleanup', `class Header extends CollectionViewSupplementaryView { ${fields} onConfigure() { this.source.onDataSourceChanged(this.boundDataChanged); } stop() { this.source.removeOnDataSourceChanged(this.boundDataChanged); } }`, 'missingCleanup'],
  ['supplementary cleanup only on reuse', `class Header extends CollectionViewSupplementaryView { ${fields} onConfigure() { this.source.onDataSourceChanged(this.boundDataChanged); } onWillReuse() { this.source.removeOnDataSourceChanged(this.boundDataChanged); } }`, 'missingCleanup'],
  ['source const alias', view('onMount() { const center = this.center; center.subscribe("Changed", this.changed); }'), 'missingCleanup'],
  ['computed API', view('onMount() { this.center["subscribe"]("Changed", this.changed); }'), 'missingCleanup'],
  ['reexported API type', 'import { Center } from "./barrel"; class Screen extends BaseView { @inject() center!: Center; onMount() { this.center.subscribe("Changed", () => {}); } }', 'lostIdentity'],
  ['concrete center', 'class Screen extends BaseView { @inject() center!: NotificationCenter; onMount() { this.center.subscribe("Changed", () => {}); } }', 'lostIdentity'],
  ['manual subscription inside decorated handler', view('@onNotification("Trigger") changedAgain(_notification: INotification) { this.center.subscribe("Changed", () => {}); }'), 'lostIdentity'],
] as const;
const valid = [
  ['coercing literal equality remains conservative', view('onMount() { this.subscription = this.center.subscribe("Changed", this.changed); } onUnmount() { if (("1" as string | number) == (1 as string | number)) this.center.unsubscribe("Changed", this.subscription!); }')],
  ['presentation arrow helper is deferred until called', view('onAppear() { this.toggle(true); } onDisappear() { this.toggle(false); } toggle = (active: boolean) => { if (active) this.subscription = this.center.subscribe("Changed", this.changed); else this.center.unsubscribe("Changed", this.subscription!); };')],
  ['paired presentation hooks', view('onAppear() { this.subscription = this.center.subscribe("Changed", this.changed); } onDisappear() { this.center.unsubscribe("Changed", this.subscription!); }')],
  ['EWTN presentation toggle through resolved local center', view('onAppear() { this.toggle(true); } onDisappear() { this.toggle(false); } toggle(active: boolean) { const center = AppUtils.resolve<INotificationCenter>("notificationCenter"); if (active && !this.subscription) { this.subscription = center.subscribe("Changed", this.changed.bind(this)); } else { center.unsubscribe("Changed", this.subscription!); this.subscription = undefined; } }')],
  ['Criterion aggregate presentation helper chain', view('onDidAppearInAggregateView(view: unknown) { super.onDidAppearInAggregateView(view); this.startActivities(); } onDidReappearInAggregateView(view: unknown) { super.onDidReappearInAggregateView(view); this.startActivities(); } startActivities() { this.toggle(true); } onWillRemoveFromAggregateView(view: unknown) { super.onWillRemoveFromAggregateView(view); this.stopActivities(); } onDisappearFromAggregateView(view: unknown) { super.onDisappearFromAggregateView(view); this.stopActivities(); } stopActivities() { this.toggle(false); } toggle(active: boolean) { const center = AppUtils.resolve<INotificationCenter>("notificationCenter"); if (active && !this.subscription) { this.subscription = center.subscribe("Changed", this.changed.bind(this)); } else { center.unsubscribe("Changed", this.subscription!); this.subscription = undefined; } }')],
  ['presentation helper false branch reaches removal', view('onAppear() { this.subscription = this.center.subscribe("Changed", this.changed); } onDisappear() { this.stop(false); } stop(active: boolean) { if (!active) this.center.unsubscribe("Changed", this.subscription!); }')],
  ['mounted phase paired with leaving Mounted', view('onViewPhaseChange(phase: ViewPhase) { if (phase === ViewPhase.Mounted) { this.subscription = this.center.subscribe("Changed", this.changed); } else if (this.subscription) { this.center.unsubscribe("Changed", this.subscription); this.subscription = undefined; } }')],
  ['mounted phase through boolean helper', view('onViewPhaseChange(phase: ViewPhase) { this.toggle(phase === ViewPhase.Mounted); } toggle(active: boolean) { if (active) this.subscription = this.center.subscribe("Changed", this.changed); else this.center.unsubscribe("Changed", this.subscription!); }')],
  ['mounted phase switch cleanup', view('onViewPhaseChange(phase: ViewPhase) { switch (phase) { case ViewPhase.Mounted: this.subscription = this.center.subscribe("Changed", this.changed); break; case ViewPhase.Unmounted: this.center.unsubscribe("Changed", this.subscription!); break; } }')],
  ['phase cleanup with explicit super unmount', view('onMount() { this.subscription = this.center.subscribe("Changed", this.changed); } onUnmount() { super.onUnmount(); } onViewPhaseChange(phase: ViewPhase) { if (phase === ViewPhase.Unmounted) this.center.unsubscribe("Changed", this.subscription!); }')],
  ['datasource presentation pair', view('onAppear() { this.source.onDataSourceChanged(this.boundDataChanged); } onDisappear() { this.source.removeOnDataSourceChanged(this.boundDataChanged); }')],
  ['saved subscription release', view('onMount() { this.subscription = this.center.subscribe("Changed", this.changed.bind(this)); } release() { if (this.subscription) { this.center.unsubscribe("Changed", this.subscription); this.subscription = undefined; } super.release(); }')],
  ['stable original callback', view('onMount() { this.center.subscribe("Changed", this.changed); } onUnmount() { this.center.unsubscribe("Changed", this.changed); super.onUnmount(); }')],
  ['helper actually called', view('onMount() { this.subscription = this.center.subscribe("Changed", this.changed.bind(this)); } release() { this.stop(); super.release(); } stop() { this.center.unsubscribe("Changed", this.subscription!); }')],
  ['helper parameter forwarding', view('onMount() { this.subscription = this.center.subscribe("Changed", this.changed.bind(this)); } release() { this.stop(this.center, "Changed", this.subscription!); } stop(center: INotificationCenter, name: string, token: IIdentifiable) { center.unsubscribe(name, token); }')],
  ['file helper forwarding', `function stop(center: INotificationCenter, name: string, token: IIdentifiable) { center.unsubscribe(name, token); } ${view('onMount() { this.subscription = this.center.subscribe("Changed", this.changed.bind(this)); } release() { stop(this.center, "Changed", this.subscription!); }')}`],
  ['token copied to owner field', view('onMount() { const token = this.center.subscribe(\"Changed\", this.changed.bind(this)); this.subscription = token; } release() { this.center.unsubscribe(\"Changed\", this.subscription!); }')],
  ['retained aliases', view('onMount() { const center = this.center; this.subscription = center.subscribe("Changed", this.changed); } release() { const center = this.center; const saved = this.subscription!; center.unsubscribe("Changed", saved); }')],
  ['datasource removal', view('onMount() { this.source.onDataSourceChanged(this.boundDataChanged); } onUnmount() { this.source.removeOnDataSourceChanged(this.boundDataChanged); }')],
  ['supplementary release helper', `class Header extends CollectionViewSupplementaryView { ${fields} onConfigure() { this.source.onDataSourceChanged(this.boundDataChanged); } onWillRelease() { this.stop(); super.onWillRelease(); } stop() { this.source.removeOnDataSourceChanged(this.boundDataChanged); } }`],
  ['decorated framework-owned handler', view('@onNotification("Changed") decorated(_notification: INotification) {}')],
  ['owner-created source', 'class Screen extends BaseView { private source = new CollectionViewDataSource([]); onMount() { this.source.onDataSourceChanged(() => {}); } }'],
  ['owner-created center', 'class Screen extends BaseView { private center = new NotificationCenter(); onMount() { this.center.subscribe("Changed", () => {}); } }'],
  ['unknown field ownership', 'class Screen extends BaseView { center!: INotificationCenter; onMount() { this.center.subscribe("Changed", () => {}); } }'],
  ['unknown method argument lifetime', 'class Screen extends BaseView { start(center: INotificationCenter) { center.subscribe("Changed", () => {}); } }'],
  ['process lifetime owner', `class Shell extends BaseApp { ${fields} onMount() { this.center.subscribe("Changed", () => {}); } }`],
  ['ordinary class', `class Service { ${fields} start() { this.center.subscribe("Changed", () => {}); } }`],
  ['unrelated API', 'class Screen extends BaseView { @inject() source!: { onDataSourceChanged(handler: () => void): void }; onMount() { this.source.onDataSourceChanged(() => {}); } }'],
  ['unrelated decorator', 'function fakeInject(): PropertyDecorator { return () => {}; } class Screen extends BaseView { @fakeInject() center!: INotificationCenter; onMount() { this.center.subscribe("Changed", () => {}); } }'],
  ['dynamic notification name', view('onMount() { this.center.subscribe(String(Math.random()), this.changed); }')],
  ['deferred registration unresolved lifetime', view('onMount() { setTimeout(() => this.center.subscribe("Changed", this.changed)); }')],
  ['ambient owner', 'declare class Screen extends BaseView { center: INotificationCenter; }'],
  ['static literal name constant', `const Changed = 'Changed'; ${view('onMount() { this.center.subscribe(Changed, this.changed); } release() { this.center.unsubscribe("Changed", this.changed); }')}`],
  ['property initializer subscription', 'class Screen extends BaseView { @inject() center!: INotificationCenter; private saved = this.center.subscribe("Changed", () => {}); release() { this.center.unsubscribe("Changed", this.saved); } }'],
] as const;

describe('subscription-cleanup', () => {
  it.each(invalid)('warns for %s', (_name, code, messageId) => {
    const { messages, diagnostics } = lintOwnershipBatching(rule, code);
    expect(diagnostics()).toEqual([]);
    expect(messages).toHaveLength(1);
    expect(messages[0].messageId).toBe(messageId);
    expect(messages[0].severity).toBe(1);
    expect(messages[0].message).toContain('external source');
    expect(messages[0].message).toMatch(/unsubscribe|removeOnDataSourceChanged/);
    expect(messages[0].fix).toBeUndefined();
  });
  it.each(valid)('allows %s', (_name, code) => {
    const { messages, diagnostics } = lintOwnershipBatching(rule, code);
    expect(diagnostics()).toEqual([]);
    expect(messages).toEqual([]);
  });
  it('recognizes cleanup inherited through an imported owner helper', () => {
    const base = ownershipImports + `export class Parent extends BaseView { ${fields} release() { this.stop(); super.release(); } protected stop() { this.center.unsubscribe("Changed", this.subscription!); } }`;
    const result = lintOwnershipBatching(rule, 'import { Parent } from "./parent"; class Screen extends Parent { onMount() { this.subscription = this.center.subscribe("Changed", this.changed.bind(this)); } }', true, { 'parent.ts': base });
    expect(result.diagnostics()).toEqual([]);
    expect(result.messages).toEqual([]);
  });
  it('follows an imported namespace cleanup helper with actual argument identities', () => {
    const helper = ownershipImports + 'export function stop(center: INotificationCenter, name: string, token: IIdentifiable) { center.unsubscribe(name, token); }';
    const result = lintOwnershipBatching(rule, 'import * as cleanup from "./cleanup";' + view('onMount() { this.subscription = this.center.subscribe("Changed", this.changed.bind(this)); } release() { cleanup.stop(this.center, "Changed", this.subscription!); }'), true, { 'cleanup.ts': helper });
    expect(result.diagnostics()).toEqual([]);
    expect(result.messages).toEqual([]);
  });
  it('does not invent inherited cleanup after an overriding release drops super', () => {
    const base = ownershipImports + `export class Parent extends BaseView { ${fields} release() { this.center.unsubscribe("Changed", this.subscription!); } }`;
    const result = lintOwnershipBatching(rule, 'import { Parent } from "./parent"; class Screen extends Parent { onMount() { this.subscription = this.center.subscribe("Changed", this.changed.bind(this)); } release() {} }', true, { 'parent.ts': base });
    expect(result.diagnostics()).toEqual([]);
    expect(result.messages).toHaveLength(1);
  });
  it('skips when ownership provenance is unavailable', () => expect(lintOwnershipBatching(rule, invalid[0][1], false).messages).toEqual([]));
});
