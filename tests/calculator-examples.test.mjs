import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCalculatorExamples, priceRecordDate } from '../src/utils/calculator-examples.js';
import { PRICES } from '../src/data/prices.js';

const rates = { USD: 80, EUR: 90, RUB: 1, date: '2026-10-31', source: 'https://www.cbr.ru/' };
const prices = [
  { name: 'Турция (Анталья, Стамбул)', iata: 'AYT', flight: [250, 450, 900], hotel: [30, 80, 250], food: [15, 40, 120] },
  { name: 'Египет (Хургада, Шарм)', iata: 'HRG', flight: [350, 550, 1100], hotel: [35, 100, 300], food: [15, 40, 120] },
  { name: 'Таиланд (Пхукет, Самуи, Бангкок)', iata: 'HKT', flight: [600, 900, 2000], hotel: [25, 80, 250], food: [10, 30, 100] },
];
const directions = prices.map((price, i) => ({ slug: ['turkey', 'egypt', 'thailand'][i], price: { name: price.name }, r: [] }));
const visas = { turkey: { cost: 'бесплатно' }, egypt: { cost: '$30' }, thailand: { cost: 'бесплатно' } };

test('примеры складывают перелёт, семь ночей, питание и известный сбор без запаса', () => {
  const result = buildCalculatorExamples({ prices, directions, visas, rates });
  assert.deepEqual(result.map(x => [x.slug, x.totalMinor]), [
    ['turkey', 4_520_000], ['egypt', 5_840_000], ['thailand', 6_760_000],
  ]);
  const egypt = result.find(x => x.slug === 'egypt');
  assert.deepEqual(egypt.rows.filter(x => x.known).map(x => [x.id, x.minor]), [
    ['flight', 2_800_000], ['hotel', 1_960_000], ['food', 840_000], ['entry', 240_000],
  ]);
  assert.deepEqual(egypt.unknown, ['Транспорт на месте', 'Экскурсии и развлечения', 'Страховка', 'Прочие расходы']);
  assert.equal(egypt.recordedAt, '2026-04-30');
});

test('дата исходной оценки не выдаётся за дату нового набора цен', () => {
  const changed = structuredClone(prices);
  changed[0].hotel[0] += 1;
  const result = buildCalculatorExamples({ prices: changed, directions, visas, rates });
  assert.equal(result[0].recordedAt, null);
  assert.equal(result[1].recordedAt, '2026-04-30');
});

test('даты записей имеют формат даты и скрыты для неизвестных направлений', () => {
  for (const price of PRICES) {
    const date = priceRecordDate(price);
    if (date !== null) assert.match(date, /^\d{4}-\d{2}-\d{2}$/, price.name);
  }
  assert.equal(priceRecordDate({ ...prices[0], name: 'Неизвестное направление' }), null);
});

test('отсутствующее направление или виза не превращаются в бесплатный расчёт', () => {
  assert.throws(() => buildCalculatorExamples({ prices: prices.slice(1), directions, visas, rates }), /turkey/);
  assert.throws(() => buildCalculatorExamples({ prices, directions, visas: { ...visas, egypt: null }, rates }), /egypt/);
});
