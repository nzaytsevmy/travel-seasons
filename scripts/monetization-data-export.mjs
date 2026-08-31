#!/usr/bin/env node

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { MONETIZATION_EXPERIMENT } from '../src/data/monetization.js';

const METRIKA_COUNTER = '95832375';
const METRIKA_OUTBOUND_GOAL = '566338531';
const METRIKA_API = 'https://api-metrika.yandex.net/stat/v1/data';
const TP_FIELDS_API = 'https://api.travelpayouts.com/statistics/v1/get_fields_list';
const TP_STATS_API = 'https://api.travelpayouts.com/statistics/v1/execute_query';

const PARTNER_PATTERNS = [
  [/aviasales|авиасейлс/i, 'aviasales'],
  [/ostrovok|островок/i, 'ostrovok'],
  [/cherehapa|черехап/i, 'cherehapa'],
  [/sutochno|суточно/i, 'sutochno'],
  [/travelata|травелат/i, 'travelata'],
  [/economybookings/i, 'economybookings'],
  [/tutu|туту/i, 'tutu'],
  [/yandex.*travel|яндекс.*путешеств/i, 'yandex_travel'],
  [/otello|отелло/i, 'otello'],
  [/level.*travel|левел.*тревел/i, 'level'],
  [/tripster|трипстер/i, 'tripster'],
  [/sputnik|спутник/i, 'sputnik8'],
  [/tiqets/i, 'tiqets'],
  [/drimsim/i, 'drimsim'],
];

function nextDate(date) {
  const value = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(value.getTime())) throw new Error(`Некорректная дата: ${date}`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
}

async function jsonRequest(url, { token, body, header = 'Authorization' }) {
  const headers = { Accept: 'application/json' };
  headers[header] = header === 'Authorization' ? `OAuth ${token}` : token;
  if (body) headers['Content-Type'] = 'application/json';
  const response = await fetch(url, { method: body ? 'POST' : 'GET', headers, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${response.status} ${url}: ${JSON.stringify(data).slice(0, 500)}`);
  return data;
}

function metrikaUrl(params) {
  return `${METRIKA_API}?${new URLSearchParams(params)}`;
}

export function normalizeMetrikaClickRows(apiRows) {
  const byClick = new Map();
  for (const row of apiRows) {
    const dimensions = (row.dimensions ?? []).map((value) => value?.name ?? '');
    const [dateTime, pagePath, , key, rawValue] = dimensions;
    let clickId = rawValue;
    let readerCohort = '';
    let audienceSource = '';
    if (key === 'click_context') {
      [clickId, readerCohort = '', audienceSource = ''] = String(rawValue).split('__');
    } else if (key !== 'click_id') {
      continue;
    }
    if (!/^c[a-f0-9]{20}$/.test(clickId)) continue;
    const eventCount = Number(row.metrics?.[0] ?? 0);
    const current = byClick.get(clickId) ?? {
      click_id: clickId,
      event_time: `${dateTime.replace(' ', 'T')}+03:00`,
      page_path: pagePath,
      event_count: Number.isFinite(eventCount) ? eventCount : 0,
    };
    current.event_count = Math.max(current.event_count, Number.isFinite(eventCount) ? eventCount : 0);
    if (readerCohort) current.reader_cohort = readerCohort;
    if (audienceSource) current.audience_source = audienceSource;
    byClick.set(clickId, current);
  }
  return [...byClick.values()];
}

export function normalizeAssignmentRows(apiRows, experimentId) {
  const counts = {};
  for (const row of apiRows) {
    const dimensions = (row.dimensions ?? []).map((value) => value?.name ?? '');
    const [namespace, id, variant] = dimensions;
    if (namespace !== 'monetization_experiment' || id !== experimentId || !variant) continue;
    counts[variant] = (counts[variant] ?? 0) + Number(row.metrics?.[0] ?? 0);
  }
  return counts;
}

function normalizeVisitParamRows(apiRows, namespace, key) {
  const counts = {};
  for (const row of apiRows) {
    const dimensions = (row.dimensions ?? []).map((value) => value?.name ?? '');
    const [rowNamespace, rowKey, value] = dimensions;
    if (rowNamespace !== namespace || rowKey !== key || !value) continue;
    counts[value] = {
      users: Number(row.metrics?.[0] ?? 0),
      sessions: Number(row.metrics?.[1] ?? 0),
    };
  }
  return counts;
}

export function normalizeReaderCohortRows(apiRows) {
  return normalizeVisitParamRows(apiRows, 'reader_lifecycle', 'cohort');
}

export function normalizeAudienceSourceRows(apiRows) {
  return normalizeVisitParamRows(apiRows, 'audience_source', 'bucket');
}

function partnerOf(row) {
  const source = `${row.campaign_name_en ?? ''} ${row.campaign_name_ru ?? ''} ${row.campaign_name ?? ''}`;
  return PARTNER_PATTERNS.find(([pattern]) => pattern.test(source))?.[1] ?? `campaign_${row.campaign_id ?? 'unknown'}`;
}

export function normalizeTravelpayoutsActions(apiRows) {
  return apiRows.map((row) => {
    const status = String(row.state ?? '').toLowerCase();
    const commission = status === 'paid'
      ? (row.paid_profit_rub ?? row.profit_rub ?? '')
      : status === 'processing'
        ? (row.processing_profit_rub ?? row.profit_rub ?? '')
        : (row.paid_profit_rub ?? row.processing_profit_rub ?? row.profit_rub ?? '');
    return {
      action_id: row.action_id ?? '',
      internal_action_id: row.internal_action_id ?? '',
      external_click_id: row.external_click_id ?? '',
      sub_id: row.sub_id ?? '',
      partner: partnerOf(row),
      state: status,
      commission_rub: commission,
      currency: 'RUB',
      date: row.date ?? '',
      created_at: row.created_at ?? '',
      updated_at: row.state_updated_at ?? row.updated_at ?? '',
    };
  });
}

async function fetchMetrikaRows(params, token) {
  const rows = [];
  let offset = 1;
  for (;;) {
    const data = await jsonRequest(metrikaUrl({ ...params, offset: String(offset), limit: '10000', accuracy: 'full' }), { token });
    if (data.sampled) throw new Error('Метрика вернула семплированные данные: решение запрещено.');
    rows.push(...(data.data ?? []));
    const total = Number(data.total_rows ?? rows.length);
    if (rows.length >= total || !(data.data ?? []).length) break;
    offset += (data.data ?? []).length;
  }
  return rows;
}

export async function fetchMetrikaClicks({ token, dateFrom, dateTo }) {
  const rows = await fetchMetrikaRows({
    ids: METRIKA_COUNTER,
    date1: dateFrom,
    date2: dateTo,
    preset: 'goal_params',
    metrics: 'ym:ep:eventsNumber',
    sort: '-ym:ep:eventsNumber',
    dimensions: 'ym:ep:dateTime,ym:ep:eventURLPath,ym:ep:actionGoal,ym:ep:eventParamsLevel1,ym:ep:eventParamsLevel2',
    filters: `ym:ep:actionGoal==${METRIKA_OUTBOUND_GOAL} AND (ym:ep:eventParamsLevel1=='click_context' OR ym:ep:eventParamsLevel1=='click_id')`,
  }, token);
  return normalizeMetrikaClickRows(rows);
}

export async function fetchAssignmentCounts({ token, dateFrom, dateTo, experimentId }) {
  const rows = await fetchMetrikaRows({
    ids: METRIKA_COUNTER,
    date1: dateFrom,
    date2: dateTo,
    preset: 'content_visit_params',
    // Вариант закреплён за браузером, поэтому SRM и размер выборки считаем по
    // уникальным пользователям, а не по повторным визитам одного устройства.
    metrics: 'ym:s:users',
    sort: '-ym:s:users',
    dimensions: 'ym:s:paramsLevel1,ym:s:paramsLevel2,ym:s:paramsLevel3',
    filters: `ym:s:lastTrafficSource=='organic' AND ym:s:paramsLevel1=='monetization_experiment' AND ym:s:paramsLevel2=='${experimentId}'`,
  }, token);
  return normalizeAssignmentRows(rows, experimentId);
}

async function fetchVisitParamCounts({ token, dateFrom, dateTo, namespace }) {
  return fetchMetrikaRows({
    ids: METRIKA_COUNTER,
    date1: dateFrom,
    date2: dateTo,
    preset: 'content_visit_params',
    metrics: 'ym:s:users,ym:s:visits',
    sort: '-ym:s:visits',
    dimensions: 'ym:s:paramsLevel1,ym:s:paramsLevel2,ym:s:paramsLevel3',
    filters: `ym:s:lastTrafficSource=='organic' AND ym:s:paramsLevel1=='${namespace}'`,
  }, token);
}

export async function fetchReaderCohortCounts({ token, dateFrom, dateTo }) {
  const rows = await fetchVisitParamCounts({ token, dateFrom, dateTo, namespace: 'reader_lifecycle' });
  return normalizeReaderCohortRows(rows);
}

export async function fetchAudienceSourceCounts({ token, dateFrom, dateTo }) {
  const rows = await fetchVisitParamCounts({ token, dateFrom, dateTo, namespace: 'audience_source' });
  return normalizeAudienceSourceRows(rows);
}

export async function fetchTravelpayoutsActions({ token, dateFrom, dateTo }) {
  const fieldsData = await jsonRequest(TP_FIELDS_API, { token, header: 'X-Access-Token' });
  const available = new Set((fieldsData.fields ?? []).map((field) => field.name));
  const desired = [
    'action_id', 'internal_action_id', 'external_click_id', 'sub_id', 'campaign_id',
    'campaign_name_en', 'campaign_name_ru', 'campaign_name', 'state', 'date',
    'created_at', 'updated_at', 'state_updated_at', 'paid_profit_rub',
    'processing_profit_rub', 'profit_rub',
  ];
  const fields = desired.filter((field) => available.has(field));
  for (const required of ['action_id', 'sub_id', 'state', 'date']) {
    if (!fields.includes(required)) throw new Error(`Travelpayouts не вернул обязательное поле ${required}.`);
  }
  const rows = [];
  let offset = 0;
  for (;;) {
    const data = await jsonRequest(TP_STATS_API, {
      token,
      header: 'X-Access-Token',
      body: {
        fields,
        filters: [
          { field: 'type', op: 'eq', value: 'action' },
          { field: 'date', op: 'ge', value: dateFrom },
          { field: 'date', op: 'lt', value: nextDate(dateTo) },
        ],
        sort: [{ field: 'date', order: 'asc' }],
        offset,
        limit: 10000,
      },
    });
    rows.push(...(data.results ?? []));
    const total = Number(data.total_rows ?? rows.length);
    if (rows.length >= total || !(data.results ?? []).length) break;
    offset += (data.results ?? []).length;
  }
  return normalizeTravelpayoutsActions(rows);
}

function argsOf(argv) {
  const args = { dateFrom: '', dateTo: '', actionsThrough: '', output: 'audits/monetization-private.json', experimentId: MONETIZATION_EXPERIMENT.id };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--date-from') args.dateFrom = argv[++i] ?? '';
    if (argv[i] === '--date-to') args.dateTo = argv[++i] ?? '';
    if (argv[i] === '--actions-through') args.actionsThrough = argv[++i] ?? '';
    if (argv[i] === '--output') args.output = argv[++i] ?? '';
    if (argv[i] === '--experiment-id') args.experimentId = argv[++i] ?? '';
  }
  return args;
}

if (process.argv[1] && resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  const args = argsOf(process.argv.slice(2));
  if (!args.dateFrom || !args.dateTo) throw new Error('Нужны --date-from и --date-to.');
  const metrikaToken = process.env.METRIKA_OAUTH_TOKEN || process.env.YANDEX_OAUTH_TOKEN;
  const travelpayoutsToken = process.env.TRAVELPAYOUTS_TOKEN;
  if (!metrikaToken || !travelpayoutsToken) throw new Error('Нужны METRIKA_OAUTH_TOKEN и TRAVELPAYOUTS_TOKEN.');
  const [clickEvents, assignmentCounts, readerCohortCounts, audienceSourceCounts, actions] = await Promise.all([
    fetchMetrikaClicks({ token: metrikaToken, dateFrom: args.dateFrom, dateTo: args.dateTo }),
    fetchAssignmentCounts({ token: metrikaToken, dateFrom: args.dateFrom, dateTo: args.dateTo, experimentId: args.experimentId }),
    fetchReaderCohortCounts({ token: metrikaToken, dateFrom: args.dateFrom, dateTo: args.dateTo }),
    fetchAudienceSourceCounts({ token: metrikaToken, dateFrom: args.dateFrom, dateTo: args.dateTo }),
    fetchTravelpayoutsActions({ token: travelpayoutsToken, dateFrom: args.dateFrom, dateTo: args.actionsThrough || args.dateTo }),
  ]);
  const output = resolve(args.output);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    dateFrom: args.dateFrom,
    dateTo: args.dateTo,
    actionsThrough: args.actionsThrough || args.dateTo,
    experimentId: args.experimentId,
    experiment: args.experimentId === MONETIZATION_EXPERIMENT.id ? MONETIZATION_EXPERIMENT : { id: args.experimentId },
    asOfDate: args.actionsThrough || args.dateTo,
    assignmentCounts,
    readerCohortCounts,
    audienceSourceCounts,
    clickEvents,
    actions,
  }, null, 2)}\n`);
  console.log(`приватный денежный экспорт: ${output}; assignments=${Object.values(assignmentCounts).reduce((a, b) => a + b, 0)}, clicks=${clickEvents.length}, actions=${actions.length}`);
}
