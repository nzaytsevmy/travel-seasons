import test from 'node:test';
import assert from 'node:assert/strict';

import {
  addCtaAttribution,
  buildCtaId,
  classifyPage,
  classifyPartner,
  computeRevenueMetrics,
  isGenericAffiliateUrl,
  normalizeRevenueRow,
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

test('нулевой трафик не создаёт ложную бесконечную доходность', () => {
  assert.equal(computeRevenueMetrics({ organicSessions: 0, approvedRevenue: 100, reversedRevenue: 0 }).revenuePerThousand, null);
});

test('строка партнёра нормализует статусы и рубли без provisional в доходе', () => {
  assert.deepEqual(normalizeRevenueRow({
    date: '2026-08-30', partner: 'travelpayouts', sub_id: 'blog_georgia_tour_1',
    status: 'pending', commission_rub: '1 234,50', order_id: 'A-1',
  }), {
    date: '2026-08-30', partner: 'travelpayouts', ctaId: 'blog_georgia_tour_1',
    status: 'pending', approvedRevenue: 0, reversedRevenue: 0, orderId: 'A-1',
  });
});

test('отклонённая выплата попадает в reversals, а не в доход', () => {
  const row = normalizeRevenueRow({
    date: '2026-08-30', partner: 'travelpayouts', sub_id: 'x',
    status: 'cancelled', commission_rub: '500', order_id: 'A-2',
  });
  assert.equal(row.approvedRevenue, 0);
  assert.equal(row.reversedRevenue, 500);
});
