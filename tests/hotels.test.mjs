import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import credits from '../src/data/hotel-photo-credits.json' with { type: 'json' };
import { hotelCollection, hotelBookingUrl } from '../src/data/hotels.js';
import { classifyPage, addClickAttribution } from '../src/data/monetization.js';
import { publicPhotoCredits } from '../src/data/photo-credits.js';

test('Подборка содержит десять разных отелей с настоящими файлами и публичной атрибуцией', () => {
  const hotels = hotelCollection('singapore', { includeDraft: true }).hotels;
  assert.equal(hotels.length,10);
  assert.equal(new Set(hotels.map(h=>h.id)).size,10);
  assert.equal(new Set(hotels.map(h=>h.booking.target)).size,10);
  for(const h of hotels) {
    assert.ok(existsSync(new URL(`../src/assets/hotels/${h.image}`,import.meta.url)));
    assert.ok(credits[h.photoCreditKey||h.id]?.source);
    assert.ok(h.caveat);
  }
  const selected = hotels.map(h=>credits[h.photoCreditKey||h.id]);
  const attributed = publicPhotoCredits(selected);
  const required = selected.filter(credit => credit.license && credit.license !== 'Public domain');
  const sameCredit = (a,b) => a.source === b.source && a.creator === b.creator
    && a.license === b.license && a.licenseUrl === b.licenseUrl;
  for (const credit of required) {
    assert.ok(attributed.some(item=>sameCredit(item,credit)),`Потеряна обязательная атрибуция: ${credit.title}`);
  }
  assert.ok(attributed.every(item=>required.some(credit=>sameCredit(item,credit))), 'Публичный кредит относится к выбранному снимку');
  for (const credit of selected.filter(credit=>!credit.license)) {
    assert.equal(credit.rightsStatus,'NOT_STATED_IN_SOURCE');
    assert.equal(new URL(credit.sourcePhoto).protocol,'https:');
    assert.equal(new URL(credit.source).protocol,'https:');
  }
});
test('Неизвестное направление не превращается в чужую подборку',()=>{
  assert.equal(hotelCollection('antarctica'),null);
  assert.equal(hotelCollection('__proto__'),null);
  assert.equal(hotelCollection('not-a-real-country'),null);
});
test('Переход ведёт на конкретный отель и сохраняет erid, deep link и разные CTA',()=>{
  const subs=new Set();
  for(const h of hotelCollection('singapore', { includeDraft: true }).hotels){
    const url=new URL(hotelBookingUrl('singapore',h));
    assert.equal(url.hostname,'ostrovok.tpk.mx');
    assert.equal(url.searchParams.get('erid'),'2VtzqvE1cv3');
    assert.equal(url.searchParams.get('u'),h.booking.target);
    subs.add(url.searchParams.get('sub_id'));
    const tracked=new URL(addClickAttribution(url.href,{ctaId:`hotel_singapore_${h.id}`,experimentId:'qa',variant:'a',clickId:'c0123456789abcdef0123'}));
    assert.equal(tracked.searchParams.get('erid'),url.searchParams.get('erid'));
    assert.equal(tracked.searchParams.get('u'),h.booking.target);
    assert.ok(tracked.searchParams.get('sub_id').startsWith('tt2__'));
  }
  assert.equal(subs.size,10);
});
test('Подмена партнёра или внешнего хоста запрещена',()=>{
  const h=hotelCollection('singapore', { includeDraft: true }).hotels[0];
  for(const target of ['https://ostrovok.ru.evil.test/hotel/','javascript:alert(1)','https://user:pass@ostrovok.ru/hotel/','https://ostrovok.ru/','https://ostrovok.ru/user/login/',h.booking.target.replace('ostrovok.ru/','ostrovok.ru:444/')]){
    assert.throws(()=>hotelBookingUrl('singapore',{...h,booking:{partner:'ostrovok',target}}));
  }
});
test('Страница отелей получает страну и коммерческий контекст',()=>{
  assert.deepEqual(classifyPage('/hotels/singapore/'),{type:'hotels_country',intent:'high',destination:'singapore'});
  assert.notEqual(classifyPage('/hotels/').type,'country_hub');
});
