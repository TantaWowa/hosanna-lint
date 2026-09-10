import { describe, expect, it } from 'vitest';
import rule from './view-registration-valid';
import { lintViewFixture } from '../__test__/hosanna-view-rule-linter';

describe('view-registration-valid', () => {
  it.each([
    ['registered view', "@view('Card') export class CardView extends BaseView<ViewState> {}"],
    ['import aliases', "import { BaseView as ViewBase } from './hosanna-ui/views/lib/BaseView'; import { view as register } from './hosanna-ui/lib/decorators'; @register('Card') class CardView extends ViewBase<ViewState> {}"],
    ['namespace decorator', "import * as decorators from './hosanna-ui/lib/decorators'; @decorators.view('Card') class CardView extends BaseView<ViewState> {}"],
    ['abstract base', 'export abstract class SharedView extends BaseView<ViewState> {}'],
    ['ambient declaration', 'declare class NativeView extends BaseView<ViewState> {}'],
    ['application shell', 'class App extends BaseApp {} class ProductApp extends App {}'],
    ['namesake base', "import { BaseView as UnrelatedBase } from './namesakes'; class CardView extends UnrelatedBase {}"],
    ['ordinary class', 'class CardView {}'],
    ['registered descendant', "abstract class SharedView extends BaseView<ViewState> {} @view('Card') class CardView extends SharedView {}"],
  ])('allows %s', (_name, code) => {
    expect(lintViewFixture(code, rule)).toEqual([]);
  });

  it.each([
    ['missing decorator', 'class CardView extends BaseView<ViewState> {}', 'missing'],
    ['indirect descendant', 'abstract class SharedView extends BaseView<ViewState> {} class CardView extends SharedView {}', 'missing'],
    ['renamed base import', "import { BaseView as ViewBase } from './hosanna-ui/views/lib/BaseView'; class CardView extends ViewBase<ViewState> {}", 'missing'],
    ['unrelated decorator', "import { view as fake } from './namesakes'; @fake('Card') class CardView extends BaseView<ViewState> {}", 'missing'],
    ['mismatched name', "@view('Card') class PosterView extends BaseView<ViewState> {}", 'mismatch'],
    ['missing View suffix', "@view('Card') class Card extends BaseView<ViewState> {}", 'missingSuffix'],
    ['renamed decorator mismatch', "import { view as register } from './hosanna-ui/lib/decorators'; @register('Card') class PosterView extends BaseView<ViewState> {}", 'mismatch'],
    ['dynamic registration', "const name = 'Card'; @view(name) class CardView extends BaseView<ViewState> {}", 'dynamicName'],
  ])('reports %s', (_name, code, messageId) => {
    const messages = lintViewFixture(code, rule);
    expect(messages).toHaveLength(1);
    expect(messages[0].messageId).toBe(messageId);
    expect(messages[0].ruleId).toBe('candidate/check');
  });

  it('explains registration and the matching declaration', () => {
    const [message] = lintViewFixture('class CardView extends BaseView<ViewState> {}', rule);
    expect(message.message).toContain("Add @view('Card') and use class CardView");
    expect(message.message).toContain('generate its view metadata');
    expect(message.message).toContain('declare it abstract');
  });

  it('does not suggest an unchanged decorator for a class missing the View suffix', () => {
    const [message] = lintViewFixture("@view('Card') class Card extends BaseView<ViewState> {}", rule);
    expect(message.message).toContain('Rename the class to CardView');
    expect(message.message).not.toContain('change the decorator');
  });

  it('preserves explicit framework and author-approved host exceptions', () => {
    const code = 'class HostView extends BaseView<ViewState> {}';
    expect(lintViewFixture(code, rule, [{ mode: 'framework' }])).toEqual([]);
    expect(lintViewFixture(code, rule, [{ allowedClasses: ['HostView'] }])).toEqual([]);
    expect(lintViewFixture(code, rule, [{ allowedClasses: ['DifferentView'] }])).toHaveLength(1);
  });

  it('skips safely without typed parser services', () => {
    expect(lintViewFixture('class CardView extends BaseView<ViewState> {}', rule, [], false)).toEqual([]);
  });
});
