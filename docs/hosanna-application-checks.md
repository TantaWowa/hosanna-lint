# Hosanna application checks

These checks are enabled in the recommended preset. They report errors except
`subscription-cleanup` and `batch-data-source-updates`, which report warnings. Use
`@typescript-eslint/parser` with `parserOptions.project` or `projectService`.
Type-aware checks resolve Hosanna declarations and imported aliases; without a
TypeScript program they skip checks that require framework identity. The
directive rule remains syntax-based. Directly annotated `AsyncFunctionPointer`
uses also have a syntax-only fallback.

Each diagnostic names the offending API, class, directive, or config path,
explains the consequence, and gives the intended replacement. These examples
isolate each rule; their placeholders stand for application methods and data.

## Compiler directives: `no-runtime-conditional-compilation`

Flagged:

```ts
function isRokuRuntime() { return __ROKU__; }
const enabled = __DEV__;
const enabledLater = () => __DEV__;
configure(__ROKU__);
if (typeof __ROKU__ !== 'undefined') { render(); }
if (__ROKU__ && ready()) { render(); }
const renderer = __ROKU__ ? rokuRenderer : nativeRenderer;
```

Accepted:

```ts
if (__ROKU__) {
  if (ready()) { renderRoku(); }
}
if (!__ROKU__) { renderNative(); }
if (__APPLE__ || __ANDROID__) { configureNative(); }
declare const __ROKU__: boolean; // Ambient type declaration.
```

Only direct flag-only `if` tests preserve compiler branch pruning. Use separate
positive and negative tests; compiler branches cannot have `else` or `else if`.
Configure flags in `hsconfig.json` rather than defining or mutating them in
runtime code. Native bootstrap and compiler fixtures need explicit file scopes
in their owning lint configuration. The compiler reserves `__NAME__` identifiers
for flags, including custom names. Give non-conditional injected values an
ordinary name such as `APP_RUNTIME_PROFILE`, even when another bundler accepts
`__APP_RUNTIME_PROFILE__` as a string define.

## Async pointers: `no-async-function-pointer-invalid-reference`

Flagged, including contextually typed properties, imported/member call arguments,
and return values whose declared type traces to `AsyncFunctionPointer`:

```ts
import { HsFetchOptions } from '@hs-src/hosanna-bridge-http/HosannaFetch';
const options: HsFetchOptions = {
  postProcessFunction: response => transform(response),
};
function getHandler(): AsyncFunctionPointer { return () => transform(); }
```

Accepted:

```ts
import { HsFetchOptions } from '@hs-src/hosanna-bridge-http/HosannaFetch';
import { IHsFetchResponse } from '@hs-src/hosanna-bridge-core/api';

export function postProcess(response: IHsFetchResponse): void {
  transform(response, response.contextData);
}
const options: HsFetchOptions = {
  postProcessFunction: postProcess,
  contextData: { requestId: 'catalog' },
};
```

Roku serializes the exported module function name. Use an exported named function
and carry request-specific data in `contextData`. Ordinary callbacks whose type
is not an async pointer remain valid. Forwarding an already typed async pointer
also remains valid.

## Notification handlers: `notification-handler-valid`

For Hosanna's imported `@onNotification`, flagged:

```ts
class Listener {
  @onNotification('Changed') onChanged() {} // Runtime function.length is zero.
  @onNotification('Changed') duplicate(notification: INotification) {}
}
```

Accepted:

```ts
class Listener {
  @onNotification('Changed') onChanged(_notification: INotification) {
    refresh();
  }
}
```

The decorator checks runtime function arity during class initialization. Declare
one runtime parameter even when unused. Defaults and rest parameters affect
`function.length`; a TypeScript-only `this` parameter does not count. Register
each statically known notification name once per class target, combining work in one
handler where appropriate. Dynamic notification names and inheritance collisions
remain runtime/review checks.

## Callback removal: `no-fresh-callback-in-unsubscribe`

Flagged for Hosanna notification centers and collection data sources:

```ts
center.unsubscribe('Changed', notification => this.onChanged(notification));
center.unsubscribe('Changed', this.onChanged.bind(this));
dataSource.removeOnDataSourceChanged(function () { refresh(); });
```

Accepted:

```ts
const subscription = center.subscribe('Changed', this.onChanged.bind(this));
// Store subscription on the lifecycle owner until cleanup:
center.unsubscribe('Changed', subscription);

const handler = this.onChanged.bind(this);
dataSource.onDataSourceChanged(handler);
dataSource.removeOnDataSourceChanged(handler);
```

Removal compares callback identity. A freshly allocated function cannot remove
the original subscription. Save the notification subscription return value or
bind once and keep the original callback. Binding during subscription is valid.

## Style paths: `app-config-style-key-valid`

Given merged app config containing `controls.Card.default`, flagged:

```ts
class CardView extends BaseView<ViewState> {
  protected defaultStyleKey = 'controls.Card.typo';
  settingsKey = 'settings.missing';
}
```

Accepted:

```ts
class CardView extends BaseView<ViewState> {
  protected defaultStyleKey = 'controls.Card.default';
}
class Unrelated { defaultStyleKey = 'not.a.hosanna.path'; }
```

The check follows `$extendFile` and inspects the AppConfig inputs explicitly
declared in `.hosanna-tools/run.json`. A whole-source lint can report a missing
path only when it is absent from every resolved declared input; finding it in
one input does not prove every brand contains it. Without declared inputs, the
legacy default is `assets/meta/app.config.json`. Arbitrary config files are not
added to the search.

Use an explicit input in a per-file ESLint block when the source's owning build
is known. This overrides automatic selection and catches a key that exists in
another brand but is absent from the specified config:

```js
{
  files: ['src/brand-a/**/*.ts'],
  rules: {
    '@hosanna-eslint/app-config-style-key-valid': ['error', {
      appConfigInputs: ['assets/meta/app.config.brand-a.json'],
    }],
  },
}
```

Diagnostics name the inspected inputs. An unresolved declared input prevents a
claim of absence. The check covers static string values in object properties,
assignments, and class fields; dynamic values are skipped. `defaultStyleKey`
requires a resolved Hosanna view owner. Define a missing path in its owning
config or use an existing path.

## Supplementary ownership: `no-supplementary-declarative-view-lifecycle`

Flagged:

```ts
class CatalogHeader extends CollectionViewSupplementaryView {
  @inject() private instancePool!: IInstancePool;
  protected override onConfigure(): void {
    const parent = this.row.parent;
    if (!parent) return;
    const title = this.instancePool.get<TitleView>('TitleView', TitleView);
    title.onMount(parent);
  }
}
```

Accepted row configuration:

```ts
headerSettings: {
  headerAppearance: 'onTop',
  headerComponent: 'headerComponents.rowTitle',
  height: 60,
}
```

Define `headerComponents.rowTitle` as a fragment, using `$supportsDataMap` and
`${data.title}` for row data. CollectionView owns binding, placement, reuse, and
cleanup. Supplementary hooks can prepare fragment data, react to presentation
changes, and measure content. Retained SceneGraph nodes at the existing boundary
remain supported. Acquiring, mounting, driving, or reparenting nested declarative
views in that lifecycle violates `SUP-001`.

## View registration: `view-registration-valid`

Flagged in application source:

```ts
class CardView extends BaseView<ViewState> {} // Missing @view.
@view('Card') class PosterView extends BaseView<ViewState> {} // Name mismatch.
```

Accepted:

```ts
import { view } from '@hs-src/hosanna-ui/lib/decorators';
@view('Card') export class CardView extends BaseView<ViewState> {}
abstract class SharedView extends BaseView<ViewState> {}
```

Registration and class names must match so generation identifies the intended
view. Real `BaseApp` shell descendants and abstract bases are excluded. Framework
source must configure `{ mode: 'framework' }` for this application-only rule.
Existing explicitly approved application hosts can use narrowly scoped
`allowedClasses: ['ExactHostClass']`; keep the approval reason next to the lint
override. Avoid applying a framework exemption to app source.


## Required lifecycle work: `require-lifecycle-super`

Flagged:

```ts
class DetailsView extends BaseView<ViewState> {
  override release(): void { this.clearArtwork(); }
  override onWillReuse(): void {
    if (this.ready) { super.onWillReuse(); }
  }
}
```

Accepted:

```ts
class DetailsView extends BaseView<ViewState> {
  override release(): void {
    this.clearArtwork();
    super.release();
  }
  override onWillReuse(): void {
    super.onWillReuse();
    this.resetSelection();
  }
}
```

Every normal completion path must directly call the matching inherited method.
The diagnostic explains the work the override would skip: notification and
observer cleanup, pooled-state reset, renderer attachment, or detachment. Calls
inside deferred callbacks and unused helpers do not satisfy the contract. A
method that always throws has no normal completion path.

This applies only to actual Hosanna `BaseView` descendants overriding `release`,
`onWillReuse`, `onMount`, or `onUnmount`, and actual
`CollectionViewSupplementaryView` descendants overriding `onWillRelease` or
`onWillReuse`. It follows imported inheritance and aliases. Empty extension hooks
such as `onConfigure` are not included. The framework's own documented
`CollectionViewView.release` replacement and `FragmentViewView.onMount`/
`onUnmount` pooled-renderer replacements are exempt; application overrides are
not. These exceptions require the exact framework class and source location.
There is no autofix because cleanup ordering depends on ownership.

## Declaration purity: `no-side-effects-in-get-views`

Flagged:

```ts
protected override getViews(): ViewStruct[] {
  this.notificationCenter.subscribe('Changed', this.changed.bind(this));
  this.timerService.setTimeout(() => this.refresh(), 1000);
  this.setState({ title: 'Loaded' });
  return [Button({ id: 'refresh' })];
}
```

Accepted:

```ts
@onNotification('Changed')
protected changed(_notification: INotification): void {
  this.refresh();
}
protected override getViews(): ViewStruct[] {
  return [Button({ id: 'refresh' }).onClick(() => this.refresh())];
}
```

`getViews()` can run again while rebuilding declarations. Registering callbacks
or timers there repeats work and can retain the view; changing live state there
can schedule another rebuild. Declare initial values in the returned structs.
Use a framework-managed notification handler, the owning mounted lifecycle with
matching cleanup, or a deferred semantic event callback for side effects.

The check identifies actual Hosanna notification, observable, timer, tickable,
and live-view state APIs, plus standard timers and DOM listener registration.
It follows synchronous helpers in the same class up to eight calls, synchronous
IIFEs, and standard array callbacks. It skips deferred callbacks, unknown external
helpers, async/generator bodies, unrelated APIs, local computation, and fluent
`ViewStruct` construction. It is a check for recognizable effects, not a proof
that arbitrary application code is pure.

## Subscription ownership: `subscription-cleanup` (warning)

Flagged:

```ts
class DetailsView extends BaseView<ViewState> {
  @inject() private center!: INotificationCenter;
  start(): void {
    this.center.subscribe('Changed', this.changed.bind(this));
  }
}
```

Accepted:

```ts
class DetailsView extends BaseView<ViewState> {
  @inject() private center!: INotificationCenter;
  private subscription?: IIdentifiable;
  start(): void {
    this.subscription = this.center.subscribe('Changed', this.changed.bind(this));
  }
  override release(): void {
    if (this.subscription) {
      this.center.unsubscribe('Changed', this.subscription);
      this.subscription = undefined;
    }
    super.release();
  }
}
```

Keep the callback or returned subscription identity and remove it from the same
source and notification. For `CollectionViewDataSource.onDataSourceChanged`,
retain the original callback and pass it to `removeOnDataSourceChanged`; that
registration API does not return a subscription handle.

This warning covers transient Hosanna view/supplementary owners registering with
recognizable injected, resolved, or constructor-supplied external sources. It
looks for matching removal reachable from `release`, `onUnmount`, or
`onWillRelease`, following local and inherited cleanup helpers. For actual
`BaseView` phase hooks, it also follows `onViewPhaseChange(ViewPhase.Unmounted)`
when the framework's `onUnmount` remains reachable. Registering at
`ViewPhase.Mounted` and removing when leaving Mounted is an accepted pair.

Presentation subscriptions reached from `onAppear`, `onDidAppearInAggregateView`,
or `onDidReappearInAggregateView` may instead pair with `onDisappear` or the
framework's aggregate-view disappearance/removal hooks. This requires the actual
`BaseView` hook declarations and the same source, notification, and saved identity.
A registration also reached from construction, configuration, mounting, or the
Mounted phase still needs unmount/release cleanup; a presentation caller alone
does not change that lifetime. Boolean helper arguments are followed, so
`toggleListener(false)` must reach the removal branch.

A helper that is never called, code after an unconditional return/throw, and a
statically false branch do not count. Framework-managed `@onNotification` needs
no manual pair.
Process-lifetime `BaseApp` owners, owner-created sources, dynamic notification
names, and unresolved/delegated lifetimes are outside this initial check.

A warning means the local ownership evidence needs review, not that a runtime
leak has been proven. Finding a reachable cleanup call also does not prove that
all runtime paths clean up or that repeated registration is safe.

## Literal focus references: `focus-target-valid`

Flagged:

```ts
protected override getViews(): ViewStruct[] {
  return [
    Button({ id: 'play' }).nextFocusMap({ right: 'detailsButon' }),
    Button({ id: 'detailsButton' }),
  ];
}
```

Accepted:

```ts
protected override getViews(): ViewStruct[] {
  return [
    Button({ id: 'play' }).nextFocusMap({ right: 'detailsButton' }),
    Button({ id: 'detailsButton' }).nextFocusMap({ left: 'play', right: 'maintain' }),
  ];
}
```

The diagnostic identifies the direction and missing target, suggests a nearby
spelling when available, and explains that the target must exist in the same
view-owner scope. Inline group children share that owner; another component's
internal declarations do not. The special targets `exit`, `maintain`, and `none`
are valid.

The rule reports only when an actual BaseView's entire returned owner scope can
be resolved from real generated factories, literals, safe const aliases, and
supported fluent setters. It checks complete return branches separately.
Dynamic IDs or opaque spreads/factories, mutable declaration assembly, custom
view-building/lookup hooks, and imperative owner mutation make the scope unknown
and are skipped. Dynamic focus values and custom focus handlers are skipped.
No conclusion is drawn about cross-owner contracts or generated IDs whose
runtime parent prefix is unavailable.

## Batched item updates: `batch-data-source-updates` (warning)

Flagged:

```ts
for (let i = 0; i < items.length; i++) {
  dataSource.updateItem(rowId, i, items[i]);
  dataSource.applyUpdates();
}
for (const item of items) {
  dataSource.appendItemsToRow(rowId, [item], true); // applyNow flushes each item.
}
```

Accepted:

```ts
for (let i = 0; i < items.length; i++) {
  dataSource.updateItem(rowId, i, items[i], false);
}
dataSource.applyUpdates();
```

`applyUpdates()` synchronously notifies data-source listeners. Queue item
mutations with `applyNow` false, then flush once after the loop when intermediate
results are unnecessary. The diagnostic explains both forms and the cost.

The check requires an actual CollectionViewDataSource API and the same stable
receiver across iterations. It covers ordinary loops, synchronous standard array
iteration, and recognized mutators with immediate-apply arguments. It skips
conditional/chunked flushes, intervening checkpoint calls, async/deferred work,
changing receivers, and unrelated APIs. Intentional intermediate rendering may
justify a narrowly scoped ESLint suppression with a reason; batching has no
autofix because moving a flush can change visible behavior.
