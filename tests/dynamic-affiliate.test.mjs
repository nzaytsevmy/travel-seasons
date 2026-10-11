import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareAffiliateLinks, observeAffiliateImpressions, monetizationPayload } from '../src/scripts/monetization-tracking.js';
import { ostrovokCountry } from '../src/data/affiliate.js';

// Достаточная модель DOM для контракта ссылок; реальная видимость и клики
// дополнительно проверяются в monetization-browser.spec.ts.
function fixture() {
  const doc = new EventTarget();
  doc.body = { dataset: {} };
  doc.links = [];
  doc.querySelectorAll = selector => doc.links.filter(a => !selector.includes('impression-watched') || !a.dataset.impressionWatched);
  doc.add = (destination, prepared = false) => {
    const rel = new Set(['sponsored']);
    const a = {
      href: ostrovokCountry(destination, 'home'), dataset: { destination, placement: 'recommendation', intent: 'high' },
      ownerDocument: doc, textContent: 'Посмотреть жильё',
      relList: { contains: x => rel.has(x), add: x => rel.add(x) },
      classList: { contains: () => false }, closest: () => null,
    };
    if (prepared) a.dataset.ctaPrepared = '1';
    doc.links.push(a);
    return a;
  };
  const observed = new Set();
  const events = [];
  const win = { location: { pathname: '/' }, IntersectionObserver: class {
    constructor(cb) { this.cb = cb; win.observer = this; }
    observe(a) { observed.add(a); }
    unobserve(a) { observed.delete(a); }
  }, ym: (...args) => events.push(args) };
  return { doc, win, observed, events };
}

test('многострановая главная сохраняет страну и намерение каждой денежной ссылки', () => {
  const { doc } = fixture();
  const a = doc.add('georgia');
  a.dataset.ctaId = 'home_georgia_stay_recommendation';
  prepareAffiliateLinks(doc, '/');
  assert.equal(a.dataset.destination, 'georgia');
  assert.equal(a.dataset.intent, 'high');
  assert.equal(a.dataset.ctaId, 'home_georgia_stay_recommendation');
  assert.match(new URL(a.href).searchParams.get('sub_id'), /home_georgia_stay_recommendation/);
  assert.equal(monetizationPayload(a, '/', 'c123').destination, 'georgia');
  doc.body.dataset.journeySource = 'home_planner';
  assert.equal(monetizationPayload(a, '/', 'c123').click_context, 'c123__unknown__unattributed__home_planner');
});

test('повторная подготовка не присваивает новой ссылке ID уже существующей', () => {
  const { doc } = fixture();
  const first = doc.add('georgia');
  prepareAffiliateLinks(doc, '/');
  const next = doc.add('kenya');
  prepareAffiliateLinks(doc, '/');
  assert.notEqual(first.dataset.ctaId, next.dataset.ctaId);
});

test('обновлённые рекомендации наблюдаются и отправляют показ со страной один раз', () => {
  const { doc, win, observed, events } = fixture();
  const first = doc.add('georgia');
  prepareAffiliateLinks(doc, '/');
  observeAffiliateImpressions(doc, win);
  assert.ok(observed.has(first));
  const next = doc.add('kenya');
  prepareAffiliateLinks(doc, '/');
  doc.dispatchEvent(new Event('tt:affiliate-links-updated'));
  assert.ok(observed.has(next));
  win.observer.cb([{ target: next, isIntersecting: true, intersectionRatio: .1 }]);
  assert.equal(events.filter(a => a[2] === 'outbound_impression').length, 0, 'меньше половины ссылки не считается показом');
  win.observer.cb([{ target: next, isIntersecting: true }]);
  win.observer.cb([{ target: next, isIntersecting: true }]);
  const goals = events.filter(a => a[2] === 'outbound_impression');
  assert.equal(goals.length, 1);
  assert.equal(goals[0][3].destination, 'kenya');
});
