import test from 'node:test';
import assert from 'node:assert/strict';
import { openCalculatorSources } from '../src/utils/calculator-source-navigation.js';

function scenario(modifiers = {}) {
  const draft = { ttCalculator: 'private-budget-in-history' };
  const entries = [{ url:'/calculator/?r=1', state:draft }];
  const actions = [];
  const link = { href:'https://traveltribe.ru/calculator/?r=1#sources-title' };
  const heading = { scrollIntoView: () => actions.push('scroll'), focus: () => actions.push('focus') };
  const env = {
    history: { state:draft, pushState(state, _, url) { entries.push({ state, url }); this.state=state; } },
    document: { getElementById: id => id === 'sources-title' ? heading : null },
  };
  const event = { button:0, defaultPrevented:false, target:{ closest: () => link },
    preventDefault() { this.defaultPrevented=true; }, ...modifiers };
  return { draft, entries, actions, env, event };
}

test('переход к источникам сохраняет черновик при перезагрузке и возврате', () => {
  const s = scenario();
  const handled = openCalculatorSources(s.event, s.env);
  // A native fragment navigation creates a new classic history state of null.
  if (!handled) s.entries.push({ url:'https://traveltribe.ru/calculator/?r=1#sources-title', state:null });
  assert.equal(s.entries.length, 2);
  assert.match(s.entries[1].url, /#sources-title$/);
  assert.equal(s.entries[1].state?.ttCalculator, s.draft.ttCalculator, 'перезагрузка видит тот же черновик');
  assert.equal(s.entries[0].state.ttCalculator, s.draft.ttCalculator, 'возврат видит исходный черновик');
  assert.equal(handled, true);
  assert.equal(s.event.defaultPrevented, true);
  assert.deepEqual(s.actions, ['scroll', 'focus']);
});

test('модифицированный клик по ссылке остаётся обычным действием браузера', () => {
  const s = scenario({ metaKey:true });
  assert.equal(openCalculatorSources(s.event, s.env), false);
  assert.equal(s.event.defaultPrevented, false);
  assert.equal(s.entries.length, 1);
  assert.deepEqual(s.actions, []);
});

test('если запись в историю недоступна, переход прокручивает страницу без потери черновика', () => {
  const s = scenario();
  s.env.history.pushState = () => { throw new Error('history unavailable'); };
  assert.equal(openCalculatorSources(s.event, s.env), true);
  assert.equal(s.event.defaultPrevented, true);
  assert.equal(s.env.history.state.ttCalculator, s.draft.ttCalculator);
  assert.equal(s.entries.length, 1);
  assert.deepEqual(s.actions, ['scroll', 'focus']);
});
