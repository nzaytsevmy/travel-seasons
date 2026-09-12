import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countFilled, refuseReason } from '../scripts/prices-floor.mjs';

// 12.09.2026 аудит: любой отказ поставщика (отозванный доступ, лимит, смена формата)
// превращал живые цены в «цены нет», и файл цен перезаписывался молча.

test('обвал живых цен до нуля — файл не перезаписываем', () => {
  assert.match(refuseReason(783, 0), /ни одной/);
});

test('живых цен меньше половины прошлого обновления — отказ, а не рынок', () => {
  assert.ok(refuseReason(783, 300));
});

test('обычное колебание рынка проходит', () => {
  assert.equal(refuseReason(783, 700), null);
});

test('первое обновление без прошлого файла проходит, если цены есть', () => {
  assert.equal(refuseReason(0, 400), null);
});

test('счёт живых цен не считает пустые клетки', () => {
  assert.equal(countFilled({ HKT: { '2026-10': 25000, '2026-11': null }, DXB: { '2026-10': null } }), 1);
});
