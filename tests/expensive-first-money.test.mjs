// Дорогое направление: первой денежной ссылкой идёт дорога или тур, а не полис.
// Правило принято 04.09.2026 по замеру 06.08–02.09: такие страницы доводят до партнёра
// 4,7 визита из ста против 1,6 у страниц сборов, а единственная крупная комиссия сайта
// пришла с билета со страницы Галапагосов. Проверка читает собранную разметку, а не
// исходники: ссылки на страницах задаются переменными, и по исходнику порядок не виден.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { auditMonetization } from '../scripts/monetization-site-audit.mjs';
import { EXPENSIVE_DESTINATION_POSTS, expensiveDestinationSlug } from '../src/data/monetization.js';

const FLIGHT = 'https://aviasales.tpk.mx/JCSPlC17?erid=2Vtzqxkn4LF&sub_id=probe&u=https%3A%2F%2Fwww.aviasales.ru%2Fsearch%2FMOW1509UIO1';
const TOUR = 'https://travelme.g2afse.com/click?pid=1163&offer_id=1&sub1=probe&redirect=https%3A%2F%2Fyoutravel.me%2Ftours%2Fcountry%2Fantarctica';
const INSURANCE = 'https://cherehapa.tpk.mx/fkM7suze?erid=2VtzquZTwb5&sub_id=probe&u=https%3A%2F%2Fcherehapa.ru%2Ftravel%2F%3Fcountry%3Decuador';

const link = (href) => `<a href="${href}" class="aff-cta" rel="sponsored">ссылка</a>`;
const page = (...hrefs) => `<html><body data-destination="">${hrefs.map(link).join('\n')}</body></html>`;

function withDist(pages) {
  const dist = mkdtempSync(join(tmpdir(), 'tt-audit-'));
  for (const [path, html] of Object.entries(pages)) {
    const dir = join(dist, path);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), html);
  }
  try {
    return auditMonetization(dist);
  } finally {
    rmSync(dist, { recursive: true, force: true });
  }
}

const firstMoneyErrors = (result) => result.errors.filter((item) => item.includes('первой должна быть дорога или тур'));

test('подложенная беда: на дорогом направлении первой стоит страховка — проверка краснеет', () => {
  const result = withDist({ 'blog/galapagos-2026': page(INSURANCE, FLIGHT) });
  assert.equal(firstMoneyErrors(result).length, 1);
  assert.match(result.errors[0], /galapagos-2026/);
  assert.match(result.errors[0], /insurance/);
});

test('дорога первой — проверка молчит', () => {
  const result = withDist({ 'blog/galapagos-2026': page(FLIGHT, INSURANCE) });
  assert.deepEqual(firstMoneyErrors(result), []);
});

test('авторский тур первой — тоже норма', () => {
  const result = withDist({ 'blog/antarctica-cruise-2026': page(TOUR, INSURANCE) });
  assert.deepEqual(firstMoneyErrors(result), []);
});

test('дорогое направление вовсе без дороги и тура — проверка краснеет', () => {
  const result = withDist({ 'blog/kenya-guide-2026': page(INSURANCE) });
  assert.equal(result.errors.filter((item) => item.includes('без ссылки на дорогу или тур')).length, 1);
});

test('на обычной статье порядок не навязывается: страховка первой — это норма', () => {
  const result = withDist({ 'blog/abkhazia-2026': page(INSURANCE, FLIGHT) });
  assert.deepEqual(firstMoneyErrors(result), []);
});

test('список дорогих направлений узнаёт только свои страницы', () => {
  assert.equal(expensiveDestinationSlug('/blog/galapagos-2026/'), 'galapagos-2026');
  assert.equal(expensiveDestinationSlug('/blog/abkhazia-2026/'), '');
  assert.equal(expensiveDestinationSlug('/packing/kenya/september/'), '');
  assert.ok(EXPENSIVE_DESTINATION_POSTS.size >= 14);
});
