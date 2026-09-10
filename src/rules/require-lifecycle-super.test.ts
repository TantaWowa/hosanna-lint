import { describe, expect, it } from 'vitest';
import rule from './require-lifecycle-super';
import { lintLifecycleFixture } from '../__test__/lifecycle-super-linter';

const viewImport = "import { BaseView } from './hosanna-ui/views/lib/BaseView';";
const supplementaryImport = "import { CollectionViewSupplementaryView } from './hosanna-list/CollectionViewSupplementaryView';";
const view = (body: string) => `${viewImport} class CardView extends BaseView { override release(): void { ${body} } }`;

describe('require-lifecycle-super', () => {
  it.each([
    ['direct call', 'super.release();'],
    ['call before early return', 'super.release(); if (ready) return; cleanup();'],
    ['call at each return', 'if (ready) { super.release(); return; } super.release();'],
    ['both branches', 'if (ready) super.release(); else super.release();'],
    ['literal true branch', 'if (true) super.release();'],
    ['false branch with guaranteed else', 'if (false) return; else super.release();'],
    ['negated literal', 'if (!false) super.release();'],
    ['constant branch ignores dead alternative', 'if (true) super.release(); else return;'],
    ['return the call', 'return super.release();'],
    ['finally after normal and return paths', 'try { if (ready) return; cleanup(); } finally { super.release(); }'],
    ['finally after catch', 'try { cleanup(); } catch { recover(); } finally { super.release(); }'],
    ['finally overriding return after cleanup', 'try { super.release(); } finally { return; }'],
    ['attempted superclass call before catch', 'try { super.release(); } catch {}'],
    ['cleanup after a caught error', 'try { cleanup(); } catch { recover(); } super.release();'],
    ['catch calls super too', 'try { super.release(); } catch { super.release(); }'],
    ['normal path after a throw-only branch', 'if (ready) throw new Error(); super.release();'],
    ['always throws', 'throw new Error();'],
    ['switch with default', 'switch (kind) { case 1: super.release(); break; default: super.release(); }'],
    ['after loop', 'while (ready) { if (stop) break; } super.release();'],
    ['do-while guaranteed body', 'do { super.release(); } while (ready);'],
    ['computed member access', "super['release']();"],
    ['asserted callable', '(super.release as () => void)();'],
    ['nested unrelated function', 'const callback = () => {}; super.release();'],
  ])('allows %s', (_name, body) => {
    expect(lintLifecycleFixture(view(body), rule)).toEqual([]);
  });

  it.each([
    ['missing call', 'cleanup();'],
    ['empty override', ''],
    ['conditional call', 'if (ready) super.release();'],
    ['short-circuit call', 'ready && super.release();'],
    ['ternary call', 'ready ? super.release() : cleanup();'],
    ['early return', 'if (ready) return; super.release();'],
    ['unreachable call', 'return; super.release();'],
    ['unreachable branch', 'if (false) super.release();'],
    ['unreachable else', 'if (true) cleanup(); else super.release();'],
    ['constant outer branch still has early return', 'if (true) { if (ready) return; super.release(); }'],
    ['deferred callback', 'setTimeout(() => super.release(), 1);'],
    ['nested uncalled function', 'function finish() { super.release(); }'],
    ['synchronous helper is deliberately not proof', '(() => super.release())();'],
    ['deferred promise cleanup', 'return Promise.resolve().then(() => super.release());'],
    ['same-name recursive call', 'this.release();'],
    ['helper only', 'this.finish();'],
    ['different inherited method', 'super.onWillReuse();'],
    ['bound callable only', 'const callback = super.release.bind(this);'],
    ['optional super call', 'super.release?.();'],
    ['empty catch skips cleanup', 'try { work(); super.release(); } catch {}'],
    ['conditional finally', 'try { work(); } finally { if (ready) super.release(); }'],
    ['finally early return skips super', 'try { work(); } finally { if (ready) return; super.release(); }'],
    ['return overrides throwing path', 'try { throw new Error(); } finally { return; }'],
    ['zero-iteration loop', 'while (ready) super.release();'],
    ['for loop may not run', 'for (let i = 0; i < count; i++) super.release();'],
    ['break before update call', 'for (;; super.release()) { break; }'],
    ['break before do-while call', 'do { if (ready) break; super.release(); } while (false);'],
    ['switch without default', 'switch (kind) { case 1: super.release(); }'],
    ['only nested lifecycle', 'class Inner extends BaseView { override release() { super.release(); } }'],
  ])('reports %s', (_name, body) => {
    const messages = lintLifecycleFixture(view(body), rule);
    expect(messages).toHaveLength(1);
    expect(messages[0].messageId).toBe('missingSuper');
    expect(messages[0].message).toContain('super.release()');
  });

  it.each(['release', 'onWillReuse', 'onMount', 'onUnmount'])('checks the actual BaseView %s obligation', method => {
    const messages = lintLifecycleFixture(`${viewImport} class CardView extends BaseView { override ${method}() {} }`, rule);
    expect(messages).toHaveLength(1);
    expect(messages[0].messageId).toBe('missingSuper');
    expect(messages[0].message).toContain(`super.${method}()`);
  });

  it.each(['onWillRelease', 'onWillReuse'])('checks supplementary %s', method => {
    expect(lintLifecycleFixture(`${supplementaryImport} class Header extends CollectionViewSupplementaryView { override ${method}() {} }`, rule)[0].messageId).toBe('missingSuper');
    expect(lintLifecycleFixture(`${supplementaryImport} class Header extends CollectionViewSupplementaryView { override ${method}() { super.${method}(); } }`, rule)).toEqual([]);
  });

  it.each([
    ['import alias', "import { BaseView as Parent } from './hosanna-ui/views/lib/BaseView'; class Card extends Parent { release() {} }"],
    ['barrel import', "import { ImportedBase } from './barrel'; class Card extends ImportedBase { release() {} }"],
    ['namespace import', "import * as framework from './hosanna-ui/views/lib/BaseView'; class Card extends framework.BaseView { release() {} }"],
    ['indirect inheritance', `${viewImport} abstract class Shared extends BaseView {} class Card extends Shared { release() {} }`],
    ['abstract implementation', `${viewImport} abstract class Shared extends BaseView { release() {} }`],
    ['class expression', `${viewImport} const Card = class extends BaseView { release() {} };`],
    ['arrow field override', `${viewImport} class Card extends BaseView { release = () => {}; }`],
    ['function field override', `${viewImport} class Card extends BaseView { release = function() {}; }`],
    ['computed method name', `${viewImport} class Card extends BaseView { ['release']() {} }`],
    ['application CollectionView namesake', `${viewImport} class CollectionViewView extends BaseView { release() {} }`],
    ['real CollectionView descendant', "import { CollectionViewView } from './hosanna-list/CollectionView'; class ProductList extends CollectionViewView { release() {} }"],
  ])('resolves %s', (_name, code) => {
    const messages = lintLifecycleFixture(code, rule);
    expect(messages).toHaveLength(1);
    expect(messages[0].messageId).toBe('missingSuper');
  });

  it.each([
    ['unrelated BaseView', "import { BaseView } from './namesakes'; class Card extends BaseView { release() {} }"],
    ['unrelated supplementary', "import { CollectionViewSupplementaryView } from './namesakes'; class Header extends CollectionViewSupplementaryView { onWillRelease() {} }"],
    ['ordinary lifecycle name', 'class Cache { release() {} onWillReuse() {} }'],
    ['static method', `${viewImport} class Card extends BaseView { static release() {} }`],
    ['optional supplementary hooks', `${supplementaryImport} class Header extends CollectionViewSupplementaryView { onConfigure() {} onContentChanged() {} }`],
    ['unlisted view hook', `${viewImport} class Card extends BaseView { onWillRelease() {} render() {} getViews() {} }`],
    ['abstract declaration', `${viewImport} abstract class Card extends BaseView { abstract release(): void; }`],
    ['ambient declaration', `${viewImport} declare class Card extends BaseView { release(): void; }`],
    ['arrow field calling super', `${viewImport} class Card extends BaseView { release = () => { super.release(); }; }`],
    ['correct inherited mount args', `${viewImport} class Card extends BaseView { onMount(parent: BaseView, childIndex = -1) { super.onMount(parent, childIndex); } }`],
  ])('ignores or accepts %s', (_name, code) => {
    expect(lintLifecycleFixture(code, rule)).toEqual([]);
  });

  it('exempts only the documented framework CollectionView release replacement', () => {
    const code = "import { BaseView } from '../hosanna-ui/views/lib/BaseView'; export class CollectionViewView extends BaseView { release() {} onWillReuse() {} }";
    const messages = lintLifecycleFixture(code, rule, { filename: 'hosanna-list/CollectionView.ts' });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain('super.onWillReuse()');
  });

  it('exempts only FragmentView renderer ownership, not its other lifecycle hooks', () => {
    const code = "import { BaseView } from '../lib/BaseView'; export class FragmentViewView extends BaseView { onMount() {} onUnmount() {} release() {} onWillReuse() {} }";
    const messages = lintLifecycleFixture(code, rule, { filename: 'hosanna-ui/views/controls/FragmentView.ts' });
    expect(messages.map(message => message.message.split('()')[0])).toEqual(['release', 'onWillReuse']);
  });

  it('still checks an application FragmentView namesake', () => {
    expect(lintLifecycleFixture(`${viewImport} class FragmentViewView extends BaseView { onMount() {} onUnmount() {} }`, rule)).toHaveLength(2);
  });

  it('explains the inherited work and offers no automatic rewrite', () => {
    const [message] = lintLifecycleFixture(view(''), rule);
    expect(message.message).toContain('unsubscribe notifications, unmount the view, release its children');
    expect(message.message).toContain('every normal completion path');
    expect(message.fix).toBeUndefined();
    expect(message.suggestions).toBeUndefined();
  });

  it('does not count super when argument evaluation can throw into a normally completing catch', () => {
    const code = `${viewImport} class Card extends BaseView {
      onMount() { try { super.onMount(makeParent()); } catch {} }
    }`;
    const messages = lintLifecycleFixture(code, rule);
    expect(messages).toHaveLength(1);
    expect(messages[0].messageId).toBe('missingSuper');
  });

  it('does not extend the framework exception to a nested class with the same name', () => {
    const code = "import { BaseView } from '../hosanna-ui/views/lib/BaseView'; function factory() { class CollectionViewView extends BaseView { release() {} } return CollectionViewView; }";
    expect(lintLifecycleFixture(code, rule, { filename: 'hosanna-list/CollectionView.ts' })).toHaveLength(1);
  });

  it('skips safely when the TypeScript program is unavailable', () => {
    expect(lintLifecycleFixture(view(''), rule, { typed: false })).toEqual([]);
  });
});
