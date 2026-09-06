import test from 'node:test';
import assert from 'node:assert/strict';
import { shieldHtml, unshieldHtml, withSubId, subIdForPath, RESTORE_SCRIPT } from '../scripts/affiliate-shield.mjs';

const TPK = 'https://cherehapa.tpk.mx/fkM7suze?erid=2VtzquZTwb5&u=https%3A%2F%2Fwww.cherehapa.ru%2F';

test('метка страницы по адресу', () => {
  assert.equal(subIdForPath('/'), 'home');
  assert.equal(subIdForPath('/blog/ozero-ritsa-2026/'), 'ozero_ritsa_2026');
  assert.equal(subIdForPath('/trips/october/thailand/'), 'trips_october_thailand');
  assert.equal(subIdForPath('/kenya/'), 'hub_kenya');
  assert.equal(subIdForPath('/calculator/'), 'calculator');
});

test('sub_id ставится параметром шортлинка до &u= и не дублируется', () => {
  assert.equal(withSubId(TPK, 'ozero_ritsa_2026'),
    'https://cherehapa.tpk.mx/fkM7suze?sub_id=ozero_ritsa_2026&erid=2VtzquZTwb5&u=https%3A%2F%2Fwww.cherehapa.ru%2F');
  const already = 'https://aviasales.tpk.mx/JCSPlC17?erid=x&sub_id=galapagos_2026_top&u=https%3A%2F%2Fwww.aviasales.ru%2F';
  assert.equal(withSubId(already, 'other'), already);
  assert.equal(withSubId('https://sutochno.tpk.mx/9wjPjf99', 'gagra_2026'), 'https://sutochno.tpk.mx/9wjPjf99?sub_id=gagra_2026');
  assert.equal(withSubId('https://airalo.pxf.io/c/1?sharedID=546042_x', 'p'), 'https://airalo.pxf.io/c/1?sharedID=546042_x');
});

test('щит прячет только партнёрские адреса и возвращается без потерь', () => {
  const html = `<html><body><p><a href="/blog/x/">своя</a> <a href="https://t.me/traveltriberu">канал</a>
<a href="${TPK}" class="aff-cta" rel="sponsored">Страховка</a>
<a href="https://ostrovok.tpk.mx/xtyTcUcY?erid=2VtzqvE1cv3&sub_id=already&u=https%3A%2F%2Fostrovok.ru%2F" rel="sponsored">Отель</a></p></body></html>`;
  const { html: out, links, injected } = shieldHtml(html, '/blog/ozero-ritsa-2026/');
  assert.equal(links, 2);
  assert.equal(injected, 1);
  assert.ok(!out.includes('tpk.mx'), 'в сборке не должно остаться tpk.mx');
  assert.ok(out.includes('href="/go/" data-go="'));
  assert.ok(out.includes('href="/blog/x/"') && out.includes('href="https://t.me/traveltriberu"'));
  assert.ok(out.includes(RESTORE_SCRIPT + '</body>'), 'скрипт восстановления стоит перед </body>');
  const back = unshieldHtml(out);
  assert.ok(back.includes(`href="https://cherehapa.tpk.mx/fkM7suze?sub_id=ozero_ritsa_2026&erid=2VtzquZTwb5&u=`));
  assert.ok(back.includes('sub_id=already&u='));
  assert.equal(shieldHtml(out, '/blog/ozero-ritsa-2026/').links, 0, 'повторный щит ничего не меняет');
});

test('страница без партнёрских ссылок не получает скрипт', () => {
  const { html: out, links } = shieldHtml('<html><body><a href="/a/">x</a></body></html>', '/a/');
  assert.equal(links, 0);
  assert.ok(!out.includes('data-tt-go'));
});

test('ссылка внутри JSON-строки (FAQ в JSON-LD) тоже прячется и возвращается', () => {
  const json = '<script type="application/ld+json">{"text":"Оформить: <a href=\\"https://cherehapa.tpk.mx/fkM7suze?erid=2VtzquZTwb5&sub_id=turkey_guide_2026\\" class=\\"aff-cta\\">страховку</a>"}</script>';
  const html = `<html><body>${json}</body></html>`;
  const { html: out, links } = shieldHtml(html, '/blog/turkey-guide-2026/');
  assert.equal(links, 1);
  assert.ok(!out.includes('tpk.mx'));
  assert.ok(out.includes('href=\\"/go/\\" data-go=\\"'));
  assert.equal(unshieldHtml(out).includes('href=\\"https://cherehapa.tpk.mx/fkM7suze?erid=2VtzquZTwb5&sub_id=turkey_guide_2026\\"'), true);
});
