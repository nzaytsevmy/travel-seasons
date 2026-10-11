import test from 'node:test';
import assert from 'node:assert/strict';
import { formatRecommendationCount, readSelection, catalogHref, moscowMonth, selectDestinations, createDestinationRows, homeCollections } from '../src/utils/destination-selection.js';
import { DIRECTIONS } from '../src/data/directions.js';
import { PRICES } from '../src/data/prices.js';
import { VISA_DETAILS } from '../src/data/visa-details.js';
import { ACTIVITY_TAGS } from '../src/data/country-activity-tags.js';
import { calculateTripBudget } from '../src/utils/trip-budget.js';

test('число рекомендаций согласовано с русским текстом', () => {
  for (const [count, text] of [[0, '0 рекомендаций'], [1, '1 рекомендация'], [2, '2 рекомендации'], [4, '4 рекомендации'], [6, '6 рекомендаций'], [11, '11 рекомендаций'], [21, '21 рекомендация']]) {
    assert.equal(formatRecommendationCount(count), text);
  }
});

const rates = { USD: 84.3363, EUR: 97.7626 };
const rows = createDestinationRows(DIRECTIONS, PRICES, VISA_DETAILS, rates, ACTIVITY_TAGS);

test('октябрьская Австралия не обещает финал AFL, который проходит в сентябре', () => {
  const october = selectDestinations(rows, { m: 10 }).find(row => row.slug === 'australia-east');
  assert.doesNotMatch(october.seasonReason, /AFL/i);
});

test('карточки всех 12 месяцев объясняют сезон данными именно выбранного направления', () => {
  for (let m = 1; m <= 12; m++) {
    for (const collection of Object.values(homeCollections(rows, { m }))) {
      for (const row of collection) {
        const direction = DIRECTIONS.find(d => d.slug === row.slug);
        assert.ok(row.seasonReason?.trim(), `${row.slug}, месяц ${m}`);
        assert.equal(row.seasonReason, direction.t[m - 1]);
      }
    }
  }
});

test('месяц меняется по Москве на границе месяца и года', () => {
  assert.equal(moscowMonth(new Date('2026-12-31T21:01:00Z')), 1);
  assert.equal(moscowMonth(new Date('2026-09-30T20:59:00Z')), 9);
  assert.equal(moscowMonth(new Date('2026-09-30T21:00:00Z')), 10);
});
test('ссылка сохраняет месяц, предел бюджета, электронный въезд и настроение', () => {
  const url = catalogHref({ m: 7, max_budget: 200000, visa: 'free_evisa', vibe: 'beach' });
  const state = readSelection(new URL(url, 'https://traveltribe.ru').search);
  assert.deepEqual(state, { m: 7, max_budget: 200000, visa: 'free_evisa', vibe: 'beach', q: '', sort: 'rel' });
  assert.equal(readSelection('?m=99&max_budget=-1&visa=javascript&vibe=__proto__', 10).m, 10);
  assert.equal(readSelection('?m=99&max_budget=-1&visa=javascript&vibe=__proto__').vibe, '');
});
test('предел бюджета включителен; неизвестный полный бюджет не проходит денежный фильтр', () => {
  const sample = [99999, 100000, 100001, null].map((budget, order) => ({
    slug: String(order), nom: 'Страна', order, priceIndex: 0, visa: 'free', vibe: ['beach'],
    r: Array(12).fill('P'), budgets: Array(13).fill(budget), knownBudgets: Array(13).fill(90000),
  }));
  assert.deepEqual(selectDestinations(sample, { m: 10, max_budget: 100000 }).map(r => r.slug), ['0', '1']);
  assert.equal(selectDestinations(sample, { m: 10, visa: 'required' }).length, 0);
});
test('карточка и калькулятор используют одну сумму и тот же месяц по всем направлениям', () => {
  for (const month of [1, 7, 10, 12]) {
    for (const row of rows) {
      const d = DIRECTIONS.find(d => d.slug === row.slug);
      const expected = calculateTripBudget(d.price, { rates, visa: VISA_DETAILS[row.slug], seasons: d.r, month });
      assert.equal(row.budgets[month], expected.grand, row.slug);
      const selected = selectDestinations([row], { m: month })[0];
      if (selected) assert.equal(new URL(selected.calcUrl, 'https://traveltribe.ru').searchParams.get('m'), String(month));
    }
  }
});
test('безвиз и дешёвая подборка имеют собственные критерии и сохраняют выбранный месяц', () => {
  for (let month = 1; month <= 12; month++) {
    const collections = homeCollections(rows, { m: month, max_budget: 100000, visa: 'required' });
    assert.ok(collections.recommendations.length <= 6);
    assert.equal(collections.free.length, 4);
    assert.equal(collections.cheap.length, 6);
    assert.ok(collections.free.every(r => r.visa === 'free' && ['P', 'G'].includes(r.code)));
    const cheapest = rows.filter(r => ['P', 'G'].includes(r.r[month - 1]) && r.budgets[month] !== null)
      .sort((a, b) => a.budgets[month] - b.budgets[month]).slice(0, 6).map(r => r.slug);
    assert.deepEqual(collections.cheap.map(r => r.slug), cheapest);
  }
});
