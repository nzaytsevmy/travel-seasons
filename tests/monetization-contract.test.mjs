import test from 'node:test';
import assert from 'node:assert/strict';

import {
  addCtaAttribution,
  addClickAttribution,
  buildClickAttribution,
  buildCtaId,
  classifyPage,
  classifyPartner,
  computeRevenueMetrics,
  deduplicateRevenueRows,
  joinRevenueRowsToClicks,
  isGenericAffiliateUrl,
  normalizeRevenueRow,
  parseClickAttribution,
} from '../src/data/monetization.js';
import { destinationAffiliateUrl } from '../src/data/affiliate.js';

test('главная — discovery с низким коммерческим намерением', () => {
  assert.deepEqual(classifyPage('/'), { type: 'home', intent: 'low', destination: '' });
});

test('месячный packing знает страну и имеет высокий intent', () => {
  assert.deepEqual(classifyPage('/packing/turkey/september/'), {
    type: 'packing_month', intent: 'high', destination: 'turkey',
  });
});

test('country packing знает страну, но остаётся средним intent', () => {
  assert.deepEqual(classifyPage('/packing/japan/'), {
    type: 'packing_country', intent: 'medium', destination: 'japan',
  });
});

test('месячная поездка знает направление и имеет высокий intent', () => {
  assert.deepEqual(classifyPage('/trips/july/georgia/'), {
    type: 'trips_country_month', intent: 'high', destination: 'georgia',
  });
});

test('визовая страница — высокий intent', () => {
  assert.deepEqual(classifyPage('/visa/south-korea/'), {
    type: 'visa_country', intent: 'high', destination: 'south-korea',
  });
});

test('сравнение не притворяется одной известной страной', () => {
  assert.deepEqual(classifyPage('/compare/turkey-vs-egypt/'), {
    type: 'compare_page', intent: 'medium', destination: '',
  });
});

test('новость осознанно не монетизируется', () => {
  assert.equal(classifyPage('/novosti/2026-08-30-story/').intent, 'none');
});

test('юридическая страница осознанно не монетизируется', () => {
  assert.equal(classifyPage('/legal/privacy/').intent, 'none');
});

test('служебный verification-файл не считается страной', () => {
  assert.deepEqual(classifyPage('/yandex_3bf8388de41dc69d.html'), {
    type: 'non_content', intent: 'none', destination: '',
  });
});

test('денежная статья определяется по задаче, а не по наличию ссылки', () => {
  assert.equal(classifyPage('/blog/strahovka-dlya-puteshestviy-2026/').intent, 'high');
});

test('информационная статья не получает выдуманный коммерческий intent', () => {
  assert.equal(classifyPage('/blog/perseidy-zatmenie-avgust-2026/').intent, 'none');
});

test('гайд страны остаётся medium и сохраняет направление', () => {
  assert.deepEqual(classifyPage('/blog/georgia-guide-2026/'), {
    type: 'blog_article', intent: 'medium', destination: 'georgia',
  });
});

test('страновой хаб сохраняет направление', () => {
  assert.deepEqual(classifyPage('/turkey/'), {
    type: 'country_hub', intent: 'medium', destination: 'turkey',
  });
});

test('Aviasales определяется как перелёт', () => {
  assert.deepEqual(classifyPartner('https://aviasales.tpk.mx/x?sub_id=a'), {
    partner: 'aviasales', offer: 'flight', attribution: 'sub_id',
  });
});

test('Airalo определяется как eSIM со своим форматом метки', () => {
  assert.deepEqual(classifyPartner('https://airalo.pxf.io/c/1?sharedID=546042_a'), {
    partner: 'airalo', offer: 'esim', attribution: 'sharedID',
  });
});

test('YouTravel определяется как авторский тур', () => {
  assert.deepEqual(classifyPartner('https://travelme.g2afse.com/click?pid=1163'), {
    partner: 'youtravel', offer: 'author_tour', attribution: 'sub1',
  });
});

test('неизвестный домен не объявляется партнёром', () => {
  assert.equal(classifyPartner('https://example.com/'), null);
});

test('общий оффер старой статьи превращается в проверенный страновой диплинк', () => {
  for (const partner of ['cherehapa', 'ostrovok', 'airalo', 'youtravel']) {
    const href = destinationAffiliateUrl(partner, 'georgia', 'blog_georgia_body_1');
    assert.ok(href, `${partner}: ожидается страновой URL`);
    assert.equal(isGenericAffiliateUrl(href, partner), false, `${partner}: ссылка не должна вести в общий каталог`);
  }
});

test('для неподдерживаемой Airalo страны не выдумывается несуществующий лендинг', () => {
  assert.equal(destinationAffiliateUrl('airalo', 'antarctica', 'x'), null);
});

test('cta_id стабилен, безопасен для sub_id и не длиннее 64 символов', () => {
  const one = buildCtaId('/packing/very-long-country-name/september/', 'cherehapa', 'answer capsule', 12);
  const two = buildCtaId('/packing/very-long-country-name/september/', 'cherehapa', 'answer capsule', 12);
  assert.equal(one, two);
  assert.match(one, /^[a-z0-9_]+$/);
  assert.ok(one.length <= 64);
});

test('tpk-метка меняется на CTA-level и не ломает erid с deep-link', () => {
  const before = 'https://aviasales.tpk.mx/JCSPlC17?erid=abc&sub_id=page&u=https%3A%2F%2Fwww.aviasales.ru%2Fsearch%2FMOW1509AYT1';
  const after = new URL(addCtaAttribution(before, 'packing_turkey_answer_1'));
  assert.equal(after.searchParams.get('erid'), 'abc');
  assert.equal(after.searchParams.get('sub_id'), 'packing_turkey_answer_1');
  assert.equal(after.searchParams.get('u'), 'https://www.aviasales.ru/search/MOW1509AYT1');
});

test('click-level Travelpayouts-метка содержит CTA, эксперимент, вариант и уникальный клик', () => {
  const token = buildClickAttribution({
    ctaId: 'packing_turkey_answer_1',
    experimentId: 'monetization_aa_click_join_v1',
    variant: 'a',
    clickId: 'c00112233445566778899',
  });
  assert.equal(token, 'tt2__packing_turkey_answer_1__monetization_aa_click_join_v1__a__c00112233445566778899');
  assert.deepEqual(parseClickAttribution(token), {
    contract: 'tt2',
    ctaId: 'packing_turkey_answer_1',
    experimentId: 'monetization_aa_click_join_v1',
    variant: 'a',
    clickId: 'c00112233445566778899',
    joinSupported: true,
  });
});

test('динамический click id заменяет только sub_id и сохраняет erid с deep-link', () => {
  const before = 'https://aviasales.tpk.mx/JCSPlC17?erid=abc&sub_id=packing_turkey_answer_1&u=https%3A%2F%2Fwww.aviasales.ru%2Fsearch%2FMOW1509AYT1';
  const after = new URL(addClickAttribution(before, {
    ctaId: 'packing_turkey_answer_1', experimentId: 'monetization_aa_click_join_v1',
    variant: 'b', clickId: 'cffeeddccbbaa00998877',
  }));
  assert.equal(after.searchParams.get('erid'), 'abc');
  assert.equal(after.searchParams.get('u'), 'https://www.aviasales.ru/search/MOW1509AYT1');
  assert.equal(parseClickAttribution(after.searchParams.get('sub_id')).clickId, 'cffeeddccbbaa00998877');
});

test('legacy sub_id остаётся читаемым, но не выдаётся за точный join', () => {
  assert.deepEqual(parseClickAttribution('galapagos_2026'), {
    contract: 'legacy', ctaId: 'galapagos_2026', experimentId: '', variant: '', clickId: '', joinSupported: false,
  });
});

test('Airalo сохраняет marker и получает CTA-level sharedID', () => {
  const before = 'https://airalo.pxf.io/c/1209822/1310283/15608?sharedID=546042_page&u=https%3A%2F%2Fairalo.com%2Fru%2Fjapan-esim';
  const after = new URL(addCtaAttribution(before, 'packing_japan_esim_1'));
  assert.equal(after.searchParams.get('sharedID'), '546042_packing_japan_esim_1');
  assert.equal(after.searchParams.get('u'), 'https://airalo.com/ru/japan-esim');
});

test('YouTravel получает sub1, не меняя redirect', () => {
  const before = 'https://travelme.g2afse.com/click?pid=1163&offer_id=1&redirect=https%3A%2F%2Fyoutravel.me%2Ftours%2Fcountry%2Fgruziya';
  const after = new URL(addCtaAttribution(before, 'blog_georgia_tour_1'));
  assert.equal(after.searchParams.get('sub1'), 'blog_georgia_tour_1');
  assert.equal(after.searchParams.get('redirect'), 'https://youtravel.me/tours/country/gruziya');
});

test('PlatipoMiru получает utm_content без потери CPA-меток', () => {
  const before = 'https://platipomiru.com/?utm_source=traveltribe&utm_medium=cpa';
  const after = new URL(addCtaAttribution(before, 'cards_virtual_card_1'));
  assert.equal(after.searchParams.get('utm_source'), 'traveltribe');
  assert.equal(after.searchParams.get('utm_medium'), 'cpa');
  assert.equal(after.searchParams.get('utm_content'), 'cards_virtual_card_1');
});

test('отмена вычитается из подтверждённой комиссии', () => {
  assert.deepEqual(computeRevenueMetrics({ organicSessions: 1000, approvedRevenue: 120, reversedRevenue: 20, approvedOrders: 3 }), {
    organicSessions: 1000,
    approvedOrders: 3,
    netApprovedRevenue: 100,
    revenuePerThousand: 100,
  });
});

test('reversal может сделать когорту отрицательной и не прячется за нулём', () => {
  assert.equal(computeRevenueMetrics({
    organicSessions: 1000, approvedRevenue: 100, reversedRevenue: 150, approvedOrders: 1,
  }).netApprovedRevenue, -50);
});

test('нулевой трафик не создаёт ложную бесконечную доходность', () => {
  assert.equal(computeRevenueMetrics({ organicSessions: 0, approvedRevenue: 100, reversedRevenue: 0 }).revenuePerThousand, null);
});

test('строка партнёра нормализует статусы и рубли без provisional в доходе', () => {
  assert.deepEqual(normalizeRevenueRow({
    date: '2026-08-30', partner: 'travelpayouts', sub_id: 'blog_georgia_tour_1',
    status: 'pending', commission_rub: '1 234,50', order_id: 'A-1',
  }), {
    date: '', clickDate: '', actionDate: '2026-08-30', decisionDate: '',
    partner: 'travelpayouts', ctaId: 'blog_georgia_tour_1', currency: 'RUB',
    experimentId: '', variant: '', clickId: '', attributionContract: 'legacy',
    status: 'pending', approvedRevenue: 0, reversedRevenue: 0, orderId: 'A-1',
    internalOrderId: '', monetaryValueKnown: true,
  });
});

test('дата действия Travelpayouts не подменяет неизвестную дату клика', () => {
  const row = normalizeRevenueRow({
    date: '2026-08-30', created_at: '2026-08-30T10:00:00Z', state_updated_at: '2026-08-31T10:00:00Z',
    state: 'processing', action_id: 'TP-42', internal_action_id: 'BOOK-42',
    partner: 'aviasales', sub_id: 'galapagos_2026', profit_rub: '8084.64',
  });
  assert.equal(row.clickDate, '');
  assert.equal(row.actionDate, '2026-08-30');
  assert.equal(row.decisionDate, '2026-08-31T10:00:00Z');
  assert.equal(row.orderId, 'TP-42');
  assert.equal(row.internalOrderId, 'BOOK-42');
});

test('заказ сводится с событием Метрики только по уникальному click id', () => {
  const subId = buildClickAttribution({
    ctaId: 'blog_galapagos_aviasales_body_1', experimentId: 'monetization_aa_click_join_v1',
    variant: 'a', clickId: 'c00112233445566778899',
  });
  const joined = joinRevenueRowsToClicks([
    { partner: 'aviasales', state: 'processing', action_id: 'TP-1', sub_id: subId, profit_rub: '8084.64', date: '2026-08-30' },
  ], [
    { click_id: 'c00112233445566778899', event_time: '2026-08-29T12:34:56+03:00', page_path: '/blog/galapagos-2026/' },
  ]);
  assert.equal(joined.stats.matched, 1);
  assert.equal(joined.stats.coverage, 1);
  assert.equal(joined.rows[0].clickDate, '2026-08-29T12:34:56+03:00');
  assert.equal(joined.rows[0].pagePath, '/blog/galapagos-2026/');
});

test('дубликат click id считается неоднозначным и не создаёт ложный join', () => {
  const subId = buildClickAttribution({
    ctaId: 'cta_1', experimentId: 'monetization_aa_click_join_v1', variant: 'b', clickId: 'cffeeddccbbaa00998877',
  });
  const joined = joinRevenueRowsToClicks([
    { partner: 'aviasales', state: 'processing', action_id: 'TP-2', sub_id: subId, profit_rub: '100' },
  ], [
    { click_id: 'cffeeddccbbaa00998877', event_time: '2026-08-29T10:00:00Z' },
    { click_id: 'cffeeddccbbaa00998877', event_time: '2026-08-29T10:01:00Z' },
  ]);
  assert.equal(joined.stats.ambiguous, 1);
  assert.equal(joined.stats.matched, 0);
  assert.equal(joined.rows[0].clickDate, '');
});

test('отклонённая выплата попадает в reversals, а не в доход', () => {
  const row = normalizeRevenueRow({
    date: '2026-08-30', partner: 'travelpayouts', sub_id: 'x',
    status: 'cancelled', commission_rub: '500', order_id: 'A-2',
  });
  assert.equal(row.approvedRevenue, 0);
  assert.equal(row.reversedRevenue, 500);
});

test('повторные статусы заказа сводятся к последнему решению', () => {
  const rows = [
    normalizeRevenueRow({
      click_date: '2026-07-01', decision_date: '2026-07-05', partner: 'tp',
      sub_id: 'x', status: 'approved', commission_rub: '500', order_id: 'A-2',
    }),
    normalizeRevenueRow({
      click_date: '2026-07-01', decision_date: '2026-07-20', partner: 'tp',
      sub_id: 'x', status: 'cancelled', commission_rub: '500', order_id: 'A-2',
    }),
  ];
  const deduplicated = deduplicateRevenueRows(rows);
  assert.equal(deduplicated.length, 1);
  assert.equal(deduplicated[0].status, 'cancelled');
});

test('одинаковые номера заказов разных партнёров не склеиваются', () => {
  const rows = [
    normalizeRevenueRow({ partner: 'tp', order_id: '1', status: 'approved', commission_rub: 10 }),
    normalizeRevenueRow({ partner: 'airalo', order_id: '1', status: 'approved', commission_rub: 20 }),
  ];
  assert.equal(deduplicateRevenueRows(rows).length, 2);
});

test('валютная комиссия без рублёвого значения не превращается в ноль рублей', () => {
  const row = normalizeRevenueRow({
    click_date: '2026-07-01', decision_date: '2026-07-20', partner: 'tp',
    sub_id: 'x', status: 'approved', commission: '20', currency: 'USD', order_id: 'A-3',
  });
  assert.equal(row.monetaryValueKnown, false);
  assert.equal(row.approvedRevenue, 0);
});
