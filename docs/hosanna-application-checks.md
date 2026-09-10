# Hosanna application checks

These checks are enabled as errors in the recommended preset. Use
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
in their owning lint configuration.

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

The check reads the merged `assets/meta/app.config.json`, following
`$extendFile`. Define the missing path or use an existing one. It checks static
string values in object properties, assignments, and class fields; dynamic
values are skipped. `defaultStyleKey` requires a resolved Hosanna view owner.

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
