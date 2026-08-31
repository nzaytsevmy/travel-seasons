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
    asOfDate: '2026-08-30',
    maturityDaysByPartner: { tp: 30 },
    revenueRows: [
      { click_date: '2026-07-01', decision_date: '2026-07-20', partner: 'tp', sub_id: 'cta_1', status: 'approved', commission_rub: '1000', order_id: 'A-1' },
      { click_date: '2026-07-02', decision_date: '2026-07-21', partner: 'tp', sub_id: 'cta_2', status: 'cancelled', commission_rub: '250', order_id: 'A-2' },
      { click_date: '2026-08-20', partner: 'tp', sub_id: 'cta_3', status: 'pending', commission_rub: '5000', order_id: 'A-3' },
    ],
  });
  assert.match(report, /Чистая одобренная комиссия: \*\*750,00 ₽\*\*/);
  assert.match(report, /Одобренных действий: \*\*1\*\*/);
  assert.match(report, /Зрелых заказов: \*\*2 из 3\*\*/);
  assert.match(report, /Покрытие CTA-level атрибуцией: \*\*100,00%\*\*/);
  assert.match(report, /pending, отмены и сырые клики партнёра победой не считаются/);
  assert.doesNotMatch(report, /5[\s ]?750,00 ₽/);
});

test('последний статус заказа не удваивает одобренную и отменённую комиссию', () => {
  const report = buildReport({
    trafficSnapshot: traffic,
    asOfDate: '2026-08-30',
    maturityDaysByPartner: { tp: 30 },
    revenueRows: [
      { click_date: '2026-07-01', decision_date: '2026-07-05', partner: 'tp', sub_id: 'cta_1', status: 'approved', commission_rub: '1000', order_id: 'A-1' },
      { click_date: '2026-07-01', decision_date: '2026-07-25', partner: 'tp', sub_id: 'cta_1', status: 'cancelled', commission_rub: '1000', order_id: 'A-1' },
    ],
  });
  assert.match(report, /Одобренных действий: \*\*0\*\*/);
  assert.match(report, /Чистая одобренная комиссия: \*\*−1[\s ]?000,00 ₽\*\*/);
});

test('без окна зрелости отчёт не разрешает денежное решение', () => {
  const report = buildReport({
    trafficSnapshot: traffic,
    revenueRows: [
      { click_date: '2026-07-01', partner: 'tp', sub_id: 'cta_1', status: 'approved', commission_rub: '1000', order_id: 'A-1' },
    ],
  });
  assert.match(report, /окно зрелости не задано/i);
  assert.match(report, /финансовое решение запрещено/i);
});

test('без партнёрской выгрузки отчёт не объявляет финансовый успех', () => {
  const report = buildReport({ trafficSnapshot: traffic });
  assert.match(report, /финансовый результат считать доказанным нельзя/);
  assert.match(report, /Доход на 1 000 органических визитов: \*\*0,00 ₽\*\*/);
});

test('сырая Travelpayouts-операция получает дату клика только после точного join с Метрикой', () => {
  const subId = 'tt2__blog_galapagos_aviasales_body_1__monetization_aa_click_join_v1__a__c00112233445566778899';
  const report = buildReport({
    trafficSnapshot: traffic,
    asOfDate: '2026-10-30',
    maturityDaysByPartner: { aviasales: 30 },
    revenueRows: [{
      date: '2026-08-30', state_updated_at: '2026-10-01', partner: 'aviasales', state: 'paid',
      profit_rub: '8084.64', action_id: 'TP-1', internal_action_id: 'BOOK-1', sub_id: subId,
    }],
    clickRows: [{
      click_id: 'c00112233445566778899', event_time: '2026-08-29T12:34:56+03:00',
      page_path: '/blog/galapagos-2026/', experiment_id: 'monetization_aa_click_join_v1', variant: 'a',
    }],
  });
  assert.match(report, /Точный action→click join: \*\*100,00% \(1 из 1\)\*\*/);
  assert.match(report, /Чистая одобренная комиссия: \*\*8[\s ]?084,64 ₽\*\*/);
  assert.match(report, /Зрелых заказов: \*\*1 из 1\*\*/);
});

test('без уникального click join денежное решение запрещено даже при CTA-level sub_id', () => {
  const report = buildReport({
    trafficSnapshot: traffic,
    asOfDate: '2026-10-30',
    maturityDaysByPartner: { aviasales: 30 },
    revenueRows: [{
      click_date: '2026-08-29', partner: 'aviasales', status: 'paid', commission_rub: '100',
      order_id: 'TP-2', sub_id: 'galapagos_2026',
    }],
  });
  assert.match(report, /Точный action→click join: \*\*0,00% \(0 из 1\)\*\*/);
  assert.match(report, /точного action→click join нет/i);
  assert.match(report, /финансовое решение запрещено/i);
});

test('отчёт показывает 28- и 90-дневную ценность читателя по зрелому доходу', () => {
  const subId = 'tt2__blog_galapagos_aviasales_body_1__monetization_aa_click_join_v1__a__c00112233445566778899';
  const report = buildReport({
    trafficSnapshot: traffic,
    asOfDate: '2026-10-30',
    maturityDaysByPartner: { aviasales: 30 },
    readerCohortCounts: {
      new: { users: 80, sessions: 100 },
      returning_28_89: { users: 20, sessions: 25 },
      returning_90_plus: { users: 5, sessions: 10 },
    },
    audienceSourceCounts: {
      telegram_current: { users: 3, sessions: 4 },
      telegram_assisted_1_27: { users: 2, sessions: 3 },
    },
    revenueRows: [{
      partner: 'aviasales', state: 'paid', commission_rub: '100', action_id: 'TP-3', sub_id: subId,
    }],
    clickRows: [{
      click_id: 'c00112233445566778899', event_time: '2026-08-29T12:34:56+03:00',
      page_path: '/blog/galapagos-2026/', reader_cohort: 'returning_28_89',
      audience_source: 'telegram_current', event_count: 1,
    }],
  });
  assert.match(report, /Ценность читательских когорт/);
  assert.match(report, /returning_28_89 \| 20 \| 25 \| 1 \| 1 \| 100,00 ₽ \| 4[\s ]?000,00 ₽/);
  assert.match(report, /returning_90_plus \| 5 \| 10 \| 0 \| 0 \| 0,00 ₽ \| 0,00 ₽/);
  assert.match(report, /Telegram-assisted/);
  assert.match(report, /telegram_current \| 3 \| 4 \| 1 \| 1 \| 100,00 ₽ \| 25[\s ]?000,00 ₽/);
});

test('старые сопоставленные клики без cohort-полей не выпадают из сверки', () => {
  const subId = 'tt2__blog_galapagos_aviasales_body_1__monetization_aa_click_join_v1__a__c00112233445566778899';
  const report = buildReport({
    trafficSnapshot: traffic,
    asOfDate: '2026-10-30',
    maturityDaysByPartner: { aviasales: 30 },
    revenueRows: [{
      partner: 'aviasales', state: 'paid', commission_rub: '100', action_id: 'TP-4', sub_id: subId,
    }],
    clickRows: [{
      click_id: 'c00112233445566778899', event_time: '2026-08-29T12:34:56+03:00', event_count: 1,
    }],
  });
  assert.equal((report.match(/\| unknown \| 0 \| 0 \| 1 \| 1 \| 100,00 ₽ \| — \|/g) ?? []).length, 2);
});
