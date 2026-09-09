// Запись журнала проверок не двигает дату свежести — никакая.
//
// 07.09.2026 техническая запись о снятых партнёрских ссылках подняла 64 статьи
// одной датой; заплаткой стал признак minor: true у записи. Он требовал помнить о
// нём руками, и 08.09 следующие заходы снова подняли даты. 09.09.2026 решение
// Никиты: даты старых статей не двигаются от правок вообще — дату свежести даёт
// только updatedDate, которую ставит переработка (scripts/edit-kind.mjs), а гейт
// в tests/content-invariants.spec.ts следит, чтобы её не подкручивали иначе.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freshDate, byFreshness } from '../src/data/freshness.js';

const d = (s) => new Date(s);
const entry = (date, extra = {}) => ({ date: d(date), what: 'сверка фактов', changed: 'что-то уточнено', ...extra });

test('запись журнала без признака minor дату не двигает', () => {
  const post = { pubDate: d('2026-06-06'), checks: [entry('2026-09-08')] };
  assert.equal(freshDate(post).toISOString().slice(0, 10), '2026-06-06');
});

test('запись журнала с признаком minor дату не двигает', () => {
  const post = { pubDate: d('2026-06-06'), checks: [entry('2026-09-07', { minor: true })] };
  assert.equal(freshDate(post).toISOString().slice(0, 10), '2026-06-06');
});

test('дату двигает только updatedDate', () => {
  const post = { pubDate: d('2026-06-06'), updatedDate: d('2026-08-04'), checks: [entry('2026-09-08')] };
  assert.equal(freshDate(post).toISOString().slice(0, 10), '2026-08-04');
});

test('лента сортирует по updatedDate, а не по журналу', () => {
  const reworked = { data: { pubDate: d('2026-05-01'), updatedDate: d('2026-09-02') } };
  const touched = { data: { pubDate: d('2026-08-14'), checks: [entry('2026-09-08')] } };
  const fresh = { data: { pubDate: d('2026-09-03') } };
  const order = [touched, reworked, fresh].sort(byFreshness).map((p) => p.data.pubDate.toISOString().slice(0, 10));
  assert.deepEqual(order, ['2026-09-03', '2026-05-01', '2026-08-14']);
});
