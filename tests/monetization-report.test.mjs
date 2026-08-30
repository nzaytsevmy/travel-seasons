import test from 'node:test';
import assert from 'node:assert/strict';

import { buildReport, flattenTraffic, parseCsv } from '../scripts/monetization-report.mjs';

const traffic = {
  updated: '2026-08-30',
  posts: {
    'georgia-guide-2026': { visits: 120, live: 100, partner: 10 },
    'perseidy-zatmenie-avgust-2026': { visits: 220, live: 200, partner: 1 },
  },
  packing: { 'turkey/september': { visits: 60, live: 50, partner: 2 } },
  guides: { japan: { visits: 30, live: 25, partner: 2 } },
};

test('снимок Метрики раскладывается по page type и intent', () => {
  const rows = flattenTraffic(traffic);
  assert.equal(rows.length, 4);
  assert.deepEqual(rows.find((row) => row.path.includes('perseidy'))?.intent, 'none');
  assert.deepEqual(rows.find((row) => row.path.includes('packing'))?.type, 'packing_month');
  assert.deepEqual(rows.find((row) => row.path === '/japan/')?.destination, 'japan');
});

test('CSV читает запятые в кавычках и не сдвигает комиссию', () => {
  const rows = parseCsv('date,partner,sub_id,status,commission_rub,order_id\n2026-08-30,tp,cta_1,approved,"1 234,50",A-1\n');
  assert.equal(rows[0].commission_rub, '1 234,50');
  assert.equal(rows[0].order_id, 'A-1');
});

test('отчёт показывает чистый доход, отмены и статус зрелости', () => {
  const report = buildReport({
    trafficSnapshot: traffic,
    revenueRows: [
      { date: '2026-08-30', partner: 'tp', sub_id: 'cta_1', status: 'approved', commission_rub: '1000', order_id: 'A-1' },
      { date: '2026-08-30', partner: 'tp', sub_id: 'cta_2', status: 'cancelled', commission_rub: '250', order_id: 'A-2' },
      { date: '2026-08-30', partner: 'tp', sub_id: 'cta_3', status: 'pending', commission_rub: '5000', order_id: 'A-3' },
    ],
  });
  assert.match(report, /Чистая одобренная комиссия: \*\*750,00 ₽\*\*/);
  assert.match(report, /Одобренных действий: \*\*1\*\*/);
  assert.match(report, /pending, отмены и сырые клики партнёра победой не считаются/);
  assert.doesNotMatch(report, /5[\s ]?750,00 ₽/);
});

test('без партнёрской выгрузки отчёт не объявляет финансовый успех', () => {
  const report = buildReport({ trafficSnapshot: traffic });
  assert.match(report, /финансовый результат считать доказанным нельзя/);
  assert.match(report, /Доход на 1 000 органических визитов: \*\*0,00 ₽\*\*/);
});
