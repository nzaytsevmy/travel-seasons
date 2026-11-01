import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../src/layouts/Layout.astro', import.meta.url), 'utf8');
const privacy = source.match(/<script\b[^>]*id="calculatorPrivacy"[^>]*>([\s\S]*?)<\/script>/)?.[1] || '';
const analytics = source.match(/<!-- Аналитика:[\s\S]*?<script is:inline>([\s\S]*?)<\/script>/)[1];
function bootstrap(href) {
  const addresses = [];
  const window = { location: new URL(href), history: { state: null } };
  const listeners = {};
  window.addEventListener = (type, listener) => (listeners[type] ||= []).push(listener);
  window.dispatchEvent = event => { for (const listener of listeners[event.type] || []) listener(event); };
  window.history.replaceState = (state, _, url) => { window.history.state = state; window.location = new URL(url, window.location); };
  let enabled;
  Object.defineProperty(window, '__analyticsEnabled', { get: () => enabled, set: value => { enabled = value; addresses.push(window.location.href); } });
  const context = { window, navigator: { webdriver: true }, localStorage: { getItem: () => null }, Event: class { constructor(type) { this.type = type; } } };
  runInNewContext(privacy, context);
  runInNewContext(analytics, context);
  return { window, addresses };
}
test('общая ссылка очищается до запуска аналитики, а личный фрагмент остаётся локально', () => {
  const { window, addresses } = bootstrap('https://traveltribe.ru/calculator/?r=1#budget=private123');
  assert.deepEqual(addresses, ['https://traveltribe.ru/calculator/?r=1']);
  assert.equal(window.history.state.ttCalculator, 'private123');
});
test('чужие разделы и обычные якоря не меняются', () => {
  for (const url of ['https://traveltribe.ru/blog/example/#budget=value', 'https://traveltribe.ru/calculator/#details']) {
    const { window, addresses } = bootstrap(url);
    assert.deepEqual(addresses, [url]);
    assert.equal(window.history.state, null);
  }
});
test('слишком длинный фрагмент удаляется из адреса без сохранения в history', () => {
  const { window, addresses } = bootstrap('https://traveltribe.ru/calculator/#budget=' + 'x'.repeat(24001));
  assert.equal(new URL(addresses[0]).hash.length, 0);
  assert.equal(new URL(addresses[0]).pathname, '/calculator/');
  assert.equal(window.history.state.ttCalculator, '');
});
test('переход по личному фрагменту в открытой вкладке тоже очищает URL', () => {
  const { window } = bootstrap('https://traveltribe.ru/calculator/?r=1');
  let restored = 0;
  window.addEventListener('tt:calculator-fragment', () => restored++);
  window.location.hash = '#budget=second';
  window.dispatchEvent({ type: 'popstate' });
  window.dispatchEvent({ type: 'hashchange' });
  assert.equal(window.location.hash, '');
  assert.equal(window.history.state.ttCalculator, 'second');
  assert.equal(restored, 1);
});
