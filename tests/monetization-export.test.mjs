import test from 'node:test';
import assert from 'node:assert/strict';

import {
  fetchAssignmentCounts,
  normalizeAssignmentRows,
  normalizeMetrikaClickRows,
  normalizeTravelpayoutsActions,
} from '../scripts/monetization-data-export.mjs';

const dimension = (name) => ({ name });

test('экспорт Метрики превращает click_id-параметр в нормализованное событие', () => {
  const rows = normalizeMetrikaClickRows([{
    dimensions: [
      dimension('2026-09-01 12:00:00'), dimension('/blog/galapagos-2026/'),
      dimension('Переход к партнёру'), dimension('click_id'), dimension('c00112233445566778899'),
    ],
    metrics: [1],
  }]);
  assert.deepEqual(rows, [{
    click_id: 'c00112233445566778899', event_time: '2026-09-01T12:00:00+03:00',
    page_path: '/blog/galapagos-2026/', event_count: 1,
  }]);
});

test('назначения считаются органическими уникальными пользователями по варианту', () => {
  const rows = normalizeAssignmentRows([
    { dimensions: [dimension('monetization_experiment'), dimension('monetization_aa_click_join_v1'), dimension('a')], metrics: [101] },
    { dimensions: [dimension('monetization_experiment'), dimension('monetization_aa_click_join_v1'), dimension('b')], metrics: [99] },
  ], 'monetization_aa_click_join_v1');
  assert.deepEqual(rows, { a: 101, b: 99 });
});

test('запрос assignment согласует метрику пользователей и сортировку preset', async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = '';
  globalThis.fetch = async (url) => {
    requestedUrl = String(url);
    return new Response(JSON.stringify({ sampled: false, data: [], total_rows: 0 }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
  try {
    await fetchAssignmentCounts({
      token: 'test', dateFrom: '2026-08-31', dateTo: '2026-08-31', experimentId: 'exp_1',
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
  const query = new URL(requestedUrl).searchParams;
  assert.equal(query.get('metrics'), 'ym:s:users');
  assert.equal(query.get('sort'), '-ym:s:users');
  assert.equal(query.get('accuracy'), 'full');
});

test('сырой action Travelpayouts сохраняет оба ID, статус и правильную сумму', () => {
  const [row] = normalizeTravelpayoutsActions([{
    action_id: 'TP-1', internal_action_id: 'BOOK-1', external_click_id: 'EXT-1',
    campaign_name_ru: 'Авиасейлс', sub_id: 'tt2__cta__exp__a__c00112233445566778899',
    state: 'processing', processing_profit_rub: '8084.64', date: '2026-08-30',
    created_at: '2026-08-30 10:00:00', updated_at: '2026-08-31 10:00:00',
  }]);
  assert.deepEqual(row, {
    action_id: 'TP-1', internal_action_id: 'BOOK-1', external_click_id: 'EXT-1',
    sub_id: 'tt2__cta__exp__a__c00112233445566778899', partner: 'aviasales',
    state: 'processing', commission_rub: '8084.64', currency: 'RUB', date: '2026-08-30',
    created_at: '2026-08-30 10:00:00', updated_at: '2026-08-31 10:00:00',
  });
});
