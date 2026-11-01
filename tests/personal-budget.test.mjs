import test from 'node:test';
import assert from 'node:assert/strict';
import { personalBudget, moneyToMinor, normalizeDraft, decodeBudgets, encodeBudgets } from '../src/utils/personal-budget.js';
import { calculateTripBudget } from '../src/utils/trip-budget.js';
import { DIRECTIONS } from '../src/data/directions.js';
import { PRICES } from '../src/data/prices.js';
import { VISA_DETAILS } from '../src/data/visa-details.js';
const base = { days: 7, travelers: 2, flightTotal: 40000, hotelTotal: 21000, foodTotal: 14000, visaTotal: 2000, mandatoryTotal: 0, knownTotal: 77000, unknownCosts: [], visa: { mandatoryCosts: [] } };
test('оплаченное остаётся в стоимости; запас применяется только к оставшемуся', () => {
  const r = personalBudget(base, { costs: { flight: { paid: true }, transport: { amount: 300000 }, activities: { excluded: true }, insurance: { amount: 200000 }, other: { excluded: true } } });
  assert.equal(r.knownMinor, 8200000);
  assert.equal(r.paidMinor, 4000000);
  assert.equal(r.reserveMinor, 420000);
  assert.equal(r.remainingMinor, 4620000);
  assert.equal(r.complete, true);
});
test('ночь и номер умножают только жильё; питание — дни и людей', () => {
  const r = personalBudget(base, { nights: 5, rooms: 2, costs: { hotel: { amount: 400000 }, food: { amount: 150000 }, flight: { amount: 3200000 } } });
  assert.equal(r.rows.find(r => r.id === 'hotel').minor, 4000000);
  assert.equal(r.rows.find(r => r.id === 'food').minor, 2100000);
  assert.equal(r.rows.find(r => r.id === 'flight').minor, 3200000);
});
test('неизвестное не ноль, а явный ноль — известная сумма', () => {
  const r = personalBudget({ ...base, visaTotal: null, knownTotal: 75000, unknownCosts: ['Сборы за въезд'] }, { costs: { transport: { amount: 0 } } });
  assert.equal(r.complete, false);
  assert.equal(r.rows.find(r => r.id === 'entry').known, false);
  assert.equal(r.rows.find(r => r.id === 'transport').known, true);
  assert.equal(r.knownMinor, 7500000);
});
test('обязательную неизвестную страховку нельзя исключить; собственная сумма закрывает пробел', () => {
  const b = { ...base, visa: { mandatoryCosts: [{ label: 'Медицинская страховка', rub: null }] }, unknownCosts: ['Медицинская страховка'] };
  assert.equal(personalBudget(b, { costs: { insurance: { excluded: true } } }).rows.find(r => r.id === 'insurance').known, false);
  assert.equal(personalBudget(b, { costs: { insurance: { amount: 100000 } } }).rows.find(r => r.id === 'insurance').minor, 100000);
});
test('десятичный ввод, пределы и валюты проверяются до расчёта', () => {
  assert.equal(moneyToMinor('1 234,56', 'rub', { USD: 80.56 }), 123456);
  assert.equal(moneyToMinor('100.01', 'usd', { USD: 80.56 }), 805681);
  for (const v of ['', '-1', '1e6', 'Infinity', '10.123', '1,000.00', '<img>']) assert.equal(moneyToMinor(v, 'rub', { USD: 80.56 }), null, v);
  assert.equal(moneyToMinor('1', 'usd', { USD: 0 }), null);
});
test('ссылки и сохранённые данные ограничены схемой, версией и размером', () => {
  const drafts = { egypt: { costs: { hotel: { amount: 123456, paid: true } } }, japan: { rooms: 2 } };
  assert.deepEqual(decodeBudgets(encodeBudgets(drafts)), Object.fromEntries(Object.entries(drafts).map(([k,v]) => [k, normalizeDraft(v)])));
  assert.deepEqual(decodeBudgets('%zz'), {});
  assert.deepEqual(decodeBudgets(encodeURIComponent('{"v":2}')), {});
  assert.deepEqual(decodeBudgets('x'.repeat(25000)), {});
  const d = normalizeDraft(JSON.parse('{"reserve":-10,"rooms":999,"costs":{"flight":{"amount":-1,"paid":true},"__proto__":{"amount":5}}}'));
  assert.equal(d.reserve, 10);
  assert.equal(d.rooms, 1);
  assert.equal(d.costs.flight.amount, null);
  assert.equal(Object.hasOwn(d.costs, '__proto__'), false);
});
test('два направления не разделяют изменяемый объект', () => {
  const a = normalizeDraft(), b = normalizeDraft();
  a.costs.flight.amount = 500;
  assert.equal(b.costs.flight.amount, null);
});
test('ссылка не может исключить основную категорию, для которой нет переключателя', () => {
  const r = personalBudget(base, { costs: { flight: { excluded: true }, hotel: { excluded: true }, food: { excluded: true }, entry: { excluded: true } } });
  for (const id of ['flight', 'hotel', 'food', 'entry']) assert.equal(r.rows.find(row => row.id === id).excluded, false, id);
  assert.equal(r.knownMinor, base.knownTotal * 100);
});
test('стартовая известная сумма совпадает с общей моделью на всех направлениях и границах условий', () => {
  for (const price of PRICES) {
    const destination = DIRECTIONS.find(d => d.price?.name === price.name);
    for (const days of [1, 7, 90]) for (const travelers of [1, 4]) for (const level of [0, 1, 2]) for (const month of [0, 1, 7, 12]) {
      const b = calculateTripBudget(price, { rates: { USD: 84.3363, EUR: 97.7626 }, days, travelers, level, month, seasons: destination?.r, visa: VISA_DETAILS[destination?.slug] });
      assert.equal(personalBudget(b).knownMinor, b.knownTotal * 100, `${price.name}, ${days} days, ${travelers} people, level ${level}, month ${month}`);
    }
  }
});
test('округление исходных обязательных сборов сохраняет общий контракт', () => {
  const b = calculateTripBudget(PRICES[0], { rates: { USD: 84.3363, EUR: 97.7626 }, travelers: 4, visa: { cost: 'бесплатно', mandatoryCosts: [{ label: 'Обязательный сбор', rub: 12.34 }, { label: 'Страховка', rub: 23.45 }] } });
  assert.equal(personalBudget(b).knownMinor, b.knownTotal * 100);
});
