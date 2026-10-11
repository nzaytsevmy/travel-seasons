import test from 'node:test';
import assert from 'node:assert/strict';
import { tripServices, planningEligible } from '../src/data/trip-services.js';
import { classifyPartner } from '../src/data/monetization.js';

test('Madrid has its own hotel city and airport, not the country airport', () => {
  const items = tripServices({ pathname: '/blog/madrid-gde-ostanovitsya/', destination: 'spain', placement: 'planning' });
  assert.deepEqual(items.map(x => x.offer), ['stay', 'flight', 'insurance']);
  assert.match(new URL(items[0].href).searchParams.get('u'), /hotel\/spain\/madrid\//);
  assert.match(new URL(items[1].href).searchParams.get('u'), /MOW15\d\dMAD1$/);
  assert.match(new URL(items[2].href).searchParams.get('u'), /countries%5B0%5D=spain/);
  for (const item of items) {
    assert.ok(classifyPartner(item.href));
    assert.equal(new URL(item.href).searchParams.get('sub_id'), item.ctaId);
    assert.ok(new URL(item.href).searchParams.get('erid'));
  }
});

test('all editorial references and news are eligible, service and data paths are excluded', () => {
  for (const path of ['/blog/tutu-vozvrat-bileta-na-poezd-2026/', '/novosti/2026-10-11-madrid-thyssen-free-day/', '/packing/turkey/january/', '/calculator/']) assert.equal(planningEligible(path), true, path);
  for (const path of ['/about/', '/legal/privacy/', '/my/', '/404.html', '/go/', '/data/trip/turkey.json', '/novosti/rss.xml']) assert.equal(planningEligible(path), false, path);
});

test('unknown and multi-country itineraries use a clearly labelled general search', () => {
  const items = tripServices({ pathname: '/blog/safari-afrika-2026/', destination: '', placement: 'planning' });
  assert.equal(items.length, 3);
  assert.ok(items.every(x => x.destination === '' && x.generic));
  assert.doesNotMatch(items[1].href, /search%2F/);
  assert.match(items[1].note, /город вылета/);
});

test('month routes preserve January and December and each placement has a separate id', () => {
  for (const [month, encoded] of [['january','1501'], ['december','1512']]) {
    const item = tripServices({ pathname: `/trips/${month}/georgia/`, destination: 'georgia' }).find(x => x.offer === 'flight');
    assert.match(new URL(item.href).searchParams.get('u'), new RegExp(`MOW${encoded}TBS1$`));
  }
  const end = tripServices({pathname:'/blog/madrid-gde-ostanovitsya/',destination:'spain',placement:'planning'})[0];
  const body = tripServices({pathname:'/blog/madrid-gde-ostanovitsya/',destination:'spain',placement:'section_1'})[0];
  assert.notEqual(end.ctaId, body.ctaId);
});

test('domestic insurance uses Russia, and unsupported places never generate made-up slugs', () => {
  const domestic = tripServices({pathname:'/karelia/',destination:'karelia'});
  assert.match(new URL(domestic.find(x=>x.offer==='insurance').href).searchParams.get('u'), /russia/);
  const unknown = tripServices({pathname:'/novosti/a-place/',destination:'not-a-real-country'});
  assert.ok(unknown.every(x=>x.generic));
  assert.ok(unknown.every(x=>!x.href.includes('not-a-real-country')));
});

test('long and Cyrillic page addresses keep exact and distinct partner attribution', () => {
  for (const path of ['/novosti/2026-07-31-dfad-marine-protected-areas/', '/blog/tag/3 сентября/']) {
    for (const item of tripServices({pathname:path})) {
      assert.equal(new URL(item.href).searchParams.get('sub_id'), item.ctaId);
      assert.ok(item.ctaId.length <= 64);
    }
  }
  assert.notEqual(tripServices({pathname:'/blog/tag/сентябрь/'})[0].ctaId, tripServices({pathname:'/blog/tag/октябрь/'})[0].ctaId);
});

test('polar and multi-country itineraries do not promise a hotel or airport in the wrong place',()=>{
  const polar=tripServices({pathname:'/antarctica/'});
  assert.match(polar[0].label,/перед экспедицией/);
  assert.equal(polar[0].generic,true);
  assert.equal(new URL(polar[0].href).searchParams.get('u'),null);
  assert.match(polar[1].label,/Ушуая/);
  assert.match(new URL(polar[1].href).searchParams.get('u'),/USH1$/);
  const route=tripServices({pathname:'/trips/january/guatemala-belize/'});
  assert.equal(route[0].generic,true);
  assert.equal(route[1].generic,true);
  assert.match(route[2].href,/belize/);
});

test('Hainan article keeps Sanya, and Cambodian flights use the current Siem Reap airport',()=>{
  const hainan=tripServices({pathname:'/blog/hainan-guide-2026/',destination:'china'})[1];
  assert.match(new URL(hainan.href).searchParams.get('u'),/SYX1$/);
  const cambodia=tripServices({pathname:'/cambodia/'})[1];
  assert.match(new URL(cambodia.href).searchParams.get('u'),/SAI1$/);
});
