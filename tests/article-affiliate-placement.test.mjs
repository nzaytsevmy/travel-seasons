import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { auditArticlePlacement } from '../scripts/article-affiliate-placement.mjs';
import { auditMonetization } from '../scripts/monetization-site-audit.mjs';
const aff = '<a href="https://ostrovok.tpk.mx/example?erid=test&sub_id=test" rel="sponsored">Отели</a>';
test('общий финал и sticky не скрывают отсутствие ссылки в тексте', () => {
  const r = auditArticlePlacement(`<div class="prose"><p>Выбираем жильё.</p></div><p class="post-end-money">${aff}</p><aside>${aff}</aside>`);
  assert.equal(r.bodyLinks, 0);
  assert.equal(r.firstLinkPercent, null);
});
test('положение считается по видимому тексту, включая вложенные блоки', () => {
  const r = auditArticlePlacement(`<div class="prose"><p>${'я'.repeat(90)}</p><div><span>1234567890</span>${aff}</div></div>`);
  assert.equal(r.bodyLinks, 1);
  assert.ok(r.firstLinkPercent > 90);
});
test('проверка различает две стороны сравнения и не считает внутренние ссылки оффером', () => {
  const r = auditArticlePlacement(`<div class="prose"><h2>Жильё в Нячанге</h2>${aff}<h2>Жильё в Дананге</h2><p><a href="/vietnam/">Гайд</a></p></div>`);
  assert.equal(r.sections[0].affiliateLinks, 1);
  assert.equal(r.sections[1].affiliateLinks, 0);
});
test('ссылка в H3 принадлежит родительскому H2; скрытый текст не сдвигает позицию', () => {
  const r = auditArticlePlacement(`<div class="prose"><script>${'x'.repeat(10000)}</script><h2>Где жить</h2><h3>Центр</h3>${aff}<p>${'я'.repeat(100)}</p></div>`);
  assert.equal(r.sections.find(s=>s.heading==='Где жить').affiliateLinks, 1);
  assert.ok(r.firstLinkPercent < 20);
});

test('поздний и отсутствующий оффер требуют содержательного исключения', async () => {
  const { placementProblems } = await import('../scripts/article-affiliate-placement.mjs');
  assert.ok(placementProblems({bodyLinks:1, firstLinkPercent:80, sections:[]}).length);
  assert.equal(placementProblems({bodyLinks:1, firstLinkPercent:80, sections:[]}, {lateReason:'Сначала проверяем право на выплату, покупка возможна только в последнем разделе.'}).length, 0);
  assert.ok(placementProblems({bodyLinks:0, firstLinkPercent:null, sections:[]}, {noOfferReason:'нет'}).length);
  assert.ok(placementProblems({bodyLinks:2, firstLinkPercent:10, sections:[{heading:'Дананг',affiliateLinks:0}]}, {requiredSections:['Дананг']}).length);
});

test('новая статья с ранней ссылкой не обходит обязательное редакционное покрытие', () => {
  const dist = mkdtempSync(join(tmpdir(), 'tt-placement-'));
  try {
    const path = join(dist, 'blog/new-context-fixture');
    mkdirSync(path, { recursive: true });
    writeFileSync(join(path, 'index.html'), `<html><body><div class="prose">${aff}<h2>Жильё</h2>${aff}<p>Условия поездки.</p></div></body></html>`);
    const errors = rules => auditMonetization(dist, rules).errors.filter(e => /карты|requiredSections|карта|coverageReason/.test(e));
    assert.equal(errors({}).length, 1);
    assert.equal(errors({'new-context-fixture': null}).length, 1);
    assert.equal(errors({'new-context-fixture': {requiredSections: [], coverageReason: 42}}).length, 1);
    assert.equal(errors({'new-context-fixture': {requiredSections: ['Жильё']}}).length, 0);
  } finally { rmSync(dist, { recursive: true, force: true }); }
});
