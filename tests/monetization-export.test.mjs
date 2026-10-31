import test from 'node:test';
import assert from 'node:assert/strict';

import {
  fetchAssignmentCounts,
  fetchReaderCohortCounts,
  fetchHomeCohort,
  fetchTravelpayoutsActions,
  normalizeAssignmentRows,
  normalizeMetrikaClickRows,
  normalizeReaderCohortRows,
  normalizeTravelpayoutsActions,
} from '../scripts/monetization-data-export.mjs';

const dimension = (name) => ({ name });

test('distinct events sharing a click ID remain ambiguous instead of silently merging', () => {
  const row = (time, key, value) => ({ dimensions: [dimension(time), dimension('/georgia/'), dimension('outbound'), dimension(key), dimension(value)], metrics: [1] });
  const id = 'c00112233445566778899';
  const rows = normalizeMetrikaClickRows([
    row('2026-10-29 12:00:00', 'click_id', id),
    row('2026-10-29 12:00:00', 'click_context', `${id}__new__unattributed`),
    row('2026-10-29 12:01:00', 'click_id', id),
  ]);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].reader_cohort, 'new');
});

test('Travelpayouts export excludes another site and requires the source field', async () => {
  const original = globalThis.fetch;
  let requestedFields;
  globalThis.fetch = async (url, options) => {
    if (String(url).endsWith('get_fields_list')) return Response.json({ fields: ['action_id', 'sub_id', 'state', 'date', 'traffic_source'].map(name => ({ name })) });
    requestedFields = JSON.parse(options.body).fields;
    return Response.json({ results: [
      { action_id: 'ours', sub_id: '', state: 'paid', date: '2026-10-29', traffic_source: 429330 },
      { action_id: 'other', sub_id: '', state: 'paid', date: '2026-10-29', traffic_source: 123 },
    ], total_rows: 2 });
  };
  try {
    const rows = await fetchTravelpayoutsActions({ token: 'fixture', dateFrom: '2026-10-01', dateTo: '2026-10-29' });
    assert.ok(requestedFields.includes('traffic_source'));
    assert.deepEqual(rows.map(row => row.action_id), ['ours']);
    globalThis.fetch = async () => Response.json({ fields: ['action_id', 'sub_id', 'state', 'date'].map(name => ({ name })) });
    await assert.rejects(fetchTravelpayoutsActions({ token: 'fixture', dateFrom: '2026-10-01', dateTo: '2026-10-29' }), /traffic_source/);
  } finally { globalThis.fetch = original; }
});

test('Sputnik rollout keeps partner and CTA in the human click denominator without changing A/A assignment', () => {
  const [row] = normalizeMetrikaClickRows([{ dimensions: [
    dimension('2026-10-26 12:00:00'), dimension('/bali/'), dimension('Переход к партнёру'),
    dimension('click_context'), dimension('c00112233445566778899__new__unattributed____sputnik8__bali_sputnik8_tour_81964__sputnik_preferred_v1'),
  ], metrics: [1] }]);
  assert.equal(row.partner, 'sputnik8');
  assert.equal(row.cta_id, 'bali_sputnik8_tour_81964');
  assert.equal(row.rollout_id, 'sputnik_preferred_v1');
  assert.equal(row.reader_cohort, 'new');
  assert.equal(row.journey_source, undefined);
});

test('входная когорта главной фильтрует и сессии, и последующие клики по органическому старту /', async () => {
  const originalFetch = globalThis.fetch;
  const urls = [];
  globalThis.fetch = async url => {
    const u = new URL(url); urls.push(u);
    const session = u.searchParams.get('metrics').startsWith('ym:s:visits');
    return new Response(JSON.stringify({ sampled: false, total_rows: session ? 1 : 0,
      data: session ? [{ dimensions: [dimension('/')], metrics: [50, 0] }] : [] }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  try {
    const cohort = await fetchHomeCohort({ token: 'test', dateFrom: '2026-08-01', dateTo: '2026-08-31' });
    assert.equal(cohort.organicSessions, 50);
    assert.equal(cohort.partnerClicks, 0);
    for (const u of urls) {
      assert.match(u.searchParams.get('filters'), /ym:s:lastTrafficSource=='organic'/);
      assert.match(u.searchParams.get('filters'), /ym:s:startURLPath=='\/'/);
    }
  } finally { globalThis.fetch = originalFetch; }
});

test('путь с главной сохраняется в экспорте и после перехода в гид', () => {
  const [row] = normalizeMetrikaClickRows([{ dimensions: [
    dimension('2026-10-10 12:00:00'), dimension('/georgia/'), dimension('Переход к партнёру'),
    dimension('click_context'), dimension('c00112233445566778899__new__unattributed__home_planner'),
  ], metrics: [1] }]);
  assert.equal(row.journey_source, 'home_planner');
  assert.equal(row.page_path, '/georgia/');
});

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

test('click context сохраняет reader cohort рядом с уникальным click id', () => {
  const rows = normalizeMetrikaClickRows([{
    dimensions: [
      dimension('2026-09-01 12:00:00'), dimension('/blog/galapagos-2026/'),
      dimension('Переход к партнёру'), dimension('click_context'),
      dimension('c00112233445566778899__returning_28_89__telegram_current'),
    ],
    metrics: [1],
  }]);
  assert.deepEqual(rows, [{
    click_id: 'c00112233445566778899', event_time: '2026-09-01T12:00:00+03:00',
    page_path: '/blog/galapagos-2026/', reader_cohort: 'returning_28_89',
    audience_source: 'telegram_current', event_count: 1,
  }]);
});

test('reader cohorts нормализуются в органические users и sessions', () => {
  const result = normalizeReaderCohortRows([
    { dimensions: [dimension('reader_lifecycle'), dimension('cohort'), dimension('new')], metrics: [80, 100] },
    { dimensions: [dimension('reader_lifecycle'), dimension('cohort'), dimension('returning_28_89')], metrics: [20, 35] },
  ]);
  assert.deepEqual(result, {
    new: { users: 80, sessions: 100 },
    returning_28_89: { users: 20, sessions: 35 },
  });
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

test('экспорт cohort считает только органические визиты без семплирования', async () => {
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
    await fetchReaderCohortCounts({ token: 'test', dateFrom: '2026-08-31', dateTo: '2026-08-31' });
  } finally {
    globalThis.fetch = originalFetch;
  }
  const query = new URL(requestedUrl).searchParams;
  assert.equal(query.get('metrics'), 'ym:s:users,ym:s:visits');
  assert.match(query.get('filters') ?? '', /lastTrafficSource.*organic/);
  assert.equal(query.get('accuracy'), 'full');
});

test('сломанный JSON и неполная пагинация не превращаются в пустую выгрузку', async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (const body of ['{', JSON.stringify({sampled:false,data:[],total_rows:5}), '{}']) {
      globalThis.fetch = async () => new Response(body,{status:200});
      await assert.rejects(fetchAssignmentCounts({token:'fixture',dateFrom:'2026-08-01',dateTo:'2026-08-30',experimentId:'exp'}));
    }
  } finally {globalThis.fetch = originalFetch;}
});

test('ошибка JSON не раскрывает ответ денежного API', async () => {
  const originalFetch=globalThis.fetch;
  try {
    globalThis.fetch=async()=>new Response('TOPSECRET',{status:200});
    await assert.rejects(fetchAssignmentCounts({token:'fixture',dateFrom:'2026-08-01',dateTo:'2026-08-30',experimentId:'exp'}), error=>{
      assert.doesNotMatch(error.message,/TOPSECRET/);
      assert.match(error.message,/JSON/);
      return true;
    });
  } finally {globalThis.fetch=originalFetch;}
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
