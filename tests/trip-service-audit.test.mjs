import test from 'node:test';
import assert from 'node:assert/strict';
import { auditTripServices } from '../scripts/trip-service-audit.mjs';
import { tripServices } from '../src/data/trip-services.js';
import { classifyPage } from '../src/data/monetization.js';
const path='/blog/madrid-gde-ostanovitsya/';
const items=tripServices({pathname:path});
const anchor=item=>`<a href="${item.href.replaceAll('&','&amp;')}" data-cta-id="${item.ctaId}" rel="sponsored noopener">${item.label}</a>`;
const block=list=>`<section data-trip-planning>${list.map(anchor).join('')}</section>`;
const article=html=>`<main><div class="prose"><h2>Ответ</h2><p>Сначала решение читателя.</p></div>${html}</main>`;

test('coverage audit accepts a complete block with intact partner attribution',()=> {
  const result=auditTripServices(article(block(items)),path);
  assert.deepEqual(result.errors,[]);
  assert.deepEqual(result.offers,['stay','flight','insurance']);
});

test('a refund answer must precede all commercial planning links',()=>{
  const refund='/blog/tutu-vozvrat-bileta-na-poezd-2026/';
  const early=`<main>${block(items)}<div class="prose"><h2>Как вернуть билет</h2><p>Полный ответ.</p></div></main>`;
  assert.ok(auditTripServices(early,refund).errors.some(e=>e.includes('после основного ответа')));
  assert.deepEqual(auditTripServices(article(block(items)),refund).errors,[]);
});
test('monthly news archives have an index layout rather than an article reply',()=>{
  for(const month of ['2026-05','2026-10']) {
    const archive=`/novosti/${month}/`;
    const html=`<main><h1>Новости за месяц</h1><ul><li>Заметка</li></ul></main>${block(tripServices({pathname:archive}))}`;
    assert.deepEqual(auditTripServices(html,archive).errors,[]);
    assert.equal(classifyPage(archive).type,'news_index');
  }
});
test('individual news still requires the complete answer before the planner',()=>{
  const news='/novosti/2026-10-11-madrid-thyssen-free-day/';
  const reply='<div class="nvp-body"><h2>Что изменилось</h2><p>Практический ответ.</p></div>';
  const planner=block(tripServices({pathname:news}));
  assert.equal(classifyPage(news).type,'news_article');
  assert.ok(auditTripServices(`<main>${planner}${reply}</main>`,news).errors.some(e=>e.includes('после основного ответа')));
  assert.deepEqual(auditTripServices(`<main>${reply}${planner}</main>`,news).errors,[]);
});
test('missing insurance and duplicate planners block release',()=> {
  assert.ok(auditTripServices(block(items.slice(0,2)),path).errors.some(e=>e.startsWith('insurance:')));
  assert.ok(auditTripServices(block(items)+block(items),path).errors.some(e=>e.includes('найдено 2')));
});
test('silent loss of the partner sub ID blocks release',()=> {
  const lost={...items[0],href:items[0].href.replace(/sub_id=[^&]+/,'sub_id=another_page')};
  assert.ok(auditTripServices(block([lost,...items.slice(1)]),path).errors.some(e=>e.includes('CTA id потерян')));
});
test('legal and security attributes are mandatory',()=> {
  const html=block(items).replaceAll('sponsored noopener','nofollow').replaceAll(/erid=[^&]+&amp;/g,'');
  const errors=auditTripServices(html,path).errors;
  for(const text of ['sponsored','noopener','erid'])assert.ok(errors.some(e=>e.includes(text)));
});
test('legal pages stay free of commercial planners',()=> {
  assert.deepEqual(auditTripServices('<main>Privacy</main>','/legal/privacy/').errors,[]);
  assert.ok(auditTripServices(block(items),'/legal/privacy/').errors.length);
});
