import { describe, expect, it } from 'vitest';
import rule from './no-supplementary-declarative-view-lifecycle';
import { lintViewFixture } from '../__test__/hosanna-view-rule-linter';

const header = (body: string) => `
  class TitleView extends BaseView<ViewState> {}
  class Header extends CollectionViewSupplementaryView {
    private pool!: IInstancePool;
    private title!: TitleView;
    protected override onConfigure(): void { ${body} }
  }
`;

describe('no-supplementary-declarative-view-lifecycle', () => {
  it.each([
    ['pooled view acquisition', "this.pool.get<TitleView>('TitleView');"],
    ['pooled struct acquisition', "this.pool.get<ViewStruct<ViewState>>('ViewStruct');"],
    ['view construction', 'new TitleView();'],
    ['mount', 'this.title.onMount(this.row.parent);'],
    ['unmount', 'this.title.onUnmount();'],
    ['state update', "this.title.setState({ title: 'Featured' });"],
    ['cast receiver', "(this.title as any).setState({ title: 'Featured' });"],
    ['typed view interface', "const title: IHosannaView<ViewState> = this.title; title.setState({ title: 'Featured' });"],
    ['release', 'this.pool.release(this.title);'],
    ['renderer parenting', 'this.row.container.appendChild(this.title.renderer);'],
    ['renderer getter parenting', 'this.row.container.appendChild(this.title.getRenderer());'],
    ['renderer local alias', 'const renderer = this.title.renderer; this.row.container.appendChild(renderer);'],
  ])('reports %s', (_name, body) => {
    const messages = lintViewFixture(header(body), rule);
    expect(messages).toHaveLength(1);
    expect(messages[0].messageId).toBe('nestedView');
    expect(messages[0].ruleId).toBe('candidate/check');
  });

  it('follows imports and inherited supplementary bases, including lifecycle helpers', () => {
    const messages = lintViewFixture(`
      import { CollectionViewSupplementaryView as Supplementary } from './hosanna-list/CollectionViewSupplementaryView';
      abstract class SharedHeader extends Supplementary {}
      class TitleView extends BaseView<ViewState> {}
      class Header extends SharedHeader {
        private title!: TitleView;
        protected override onConfigure(): void { this.mountTitle(); }
        private mountTitle(): void { this.title.onMount(this.row.parent); }
      }
    `, rule);
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain('mountTitle calls onMount');
  });

  it('checks other lifecycle hooks and arrow property hooks', () => {
    for (const hook of ['onContentChanged', 'onPresentationChanged', 'onWillRelease']) {
      const messages = lintViewFixture(header('this.title.release();').replace('onConfigure', hook), rule);
      expect(messages).toHaveLength(1);
    }
    const code = header('this.title.release();').replace('onConfigure(): void {', 'onConfigure = (): void => {');
    expect(lintViewFixture(code, rule)).toHaveLength(1);
  });

  it.each([
    ['constructor', 'class Header extends CollectionViewSupplementaryView { constructor() { super(); new TitleView(); } }'],
    ['field initializer', 'class Header extends CollectionViewSupplementaryView { private title = new TitleView(); }'],
    ['field initializer helper', 'class Header extends CollectionViewSupplementaryView { private title = this.createTitle(); private createTitle() { return new TitleView(); } }'],
    ['inline synchronous callback', 'class Header extends CollectionViewSupplementaryView { private title!: TitleView; protected override onConfigure() { [1].forEach(() => this.title.onMount(this.row.parent)); } }'],
    ['forwarded ViewStruct helper', 'class Header extends CollectionViewSupplementaryView { private content!: ViewStruct<ViewState>; protected override onConfigure() { this.updateTitle(this.content); } private updateTitle(content: ViewStruct<ViewState>) { content.setState({ title: "Featured" }); } }'],
  ])('reports lifecycle work in a %s', (_name, code) => {
    const messages = lintViewFixture('class TitleView extends BaseView<ViewState> {}' + code, rule);
    expect(messages).toHaveLength(1);
    expect(messages[0].messageId).toBe('nestedView');
  });

  it.each([
    ['fragment data binding', 'class Header extends CollectionViewSupplementaryView { protected override prepareFragmentData(data: Record<string, unknown>) { return { title: data.title }; } }'],
    ['retained SceneGraph nodes', header("const node = this.fragment?.viewsById['title']; if (node) node.text = 'Featured';")],
    ['unrelated classes and methods', "import { BaseView as OtherView } from './namesakes'; class Header extends CollectionViewSupplementaryView { private title!: OtherView; protected override onConfigure() { this.title.setState({}); } }"],
    ['namesake supplementary', "import { CollectionViewSupplementaryView as OtherSupplementary } from './namesakes'; class Header extends OtherSupplementary { private title!: BaseView<ViewState>; protected override onConfigure() { this.title.setState({}); } }"],
    ['unrelated pool', "import { IInstancePool as OtherPool } from './namesakes'; class Header extends CollectionViewSupplementaryView { private pool!: OtherPool; protected override onConfigure() { this.pool.get<BaseView<ViewState>>('Card'); } }"],
    ['view struct navigation destination', header("const destination = new ViewStruct<ViewState>(); navigate(destination);")],
    ['navigation event handler', 'class Header extends CollectionViewSupplementaryView { onSelect() { const destination = new ViewStruct<ViewState>(); destination.setState({ title: "Next" }); navigate(destination); } }'],
    ['deferred navigation callback', header('registerSelection(() => { const destination = new ViewStruct<ViewState>(); destination.setState({ title: "Next" }); navigate(destination); });')],
    ['ordinary view outside supplementary', 'class CardView extends BaseView<ViewState> { update() { this.setState({ title: "Featured" }); } }'],
  ])('allows %s', (_name, code) => {
    expect(lintViewFixture(code, rule)).toEqual([]);
  });

  it('explains the conflicting owners and names the supported fragment settings', () => {
    const [message] = lintViewFixture(header('this.title.onMount(this.row.parent);'), rule);
    expect(message.message).toContain('SUP-001: onConfigure calls onMount on a declarative TitleView');
    expect(message.message).toContain('headerSettings.headerComponent or footerSettings.footerComponent');
    expect(message.message).toContain('Retained SceneGraph nodes are also supported');
  });

  it('skips safely without type services', () => {
    expect(lintViewFixture(header('this.title.onMount(this.row.parent);'), rule, [], false)).toEqual([]);
  });
});
