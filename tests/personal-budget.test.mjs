import test from 'node:test';
import assert from 'node:assert/strict';
import { personalBudget, moneyToMinor, normalizeDraft, decodeBudgets, encodeBudgets } from '../src/utils/personal-budget.js';
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
