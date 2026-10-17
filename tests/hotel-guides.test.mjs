import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { HOTEL_COLLECTIONS, hotelCollection, readyHotelCollections, hotelBookingUrl, hotelCountrySlug, hotelHubPicks, hotelGuideHubs, hotelGallery } from '../src/data/hotels.js';
import credits from '../src/data/hotel-photo-credits.json' with { type: 'json' };

test('Семьдесят подборок содержат 700 разных точных целей и уникальную атрибуцию',()=>{
  const targets=new Set(),subIds=new Set();
  assert.equal(Object.keys(HOTEL_COLLECTIONS).length,70);
  for(const [destination,collection]of Object.entries(HOTEL_COLLECTIONS)){
    assert.equal(collection.hotels.length,10,destination);
    assert.equal(new Set(collection.hotels.map(h=>h.id)).size,10,destination);
    for(const hotel of collection.hotels){
      assert.match(hotel.checked,/^\d{4}-\d{2}-\d{2}$/);
      const target=new URL(hotel.booking.target);
      assert.equal(target.hostname,'ostrovok.ru');
      const allowedTargetCountries = {'guatemala-belize':['guatemala','belize'],'costa-rica-panama':['costa_rica','panama']};
      const providerCountry = ({'japan-hokkaido':'japan',altai:'russia',kamchatka:'russia',karelia:'russia',dagestan:'russia','raja-ampat':'indonesia','dominican-republic':'dominican_republic','sumatra-kalimantan':'indonesia','new-zealand':'new_zealand','india-goa':'india',usa:'united_states_of_america','south-africa':'south_africa',uae:'united_arab_emirates',bali:'indonesia','hong-kong':'china','sri-lanka':'sri_lanka','south-korea':'south_korea','saudi-arabia':'saudi_arabia'}[destination]||destination);
      assert.ok((allowedTargetCountries[destination]||[providerCountry]).includes(target.pathname.split('/')[2]),destination+'/'+hotel.id);
      assert.match(target.pathname,/\/mid\d+\/[a-z0-9_-]+\/$/);
      assert.ok(hotel.reason&&hotel.caveat&&hotel.location);
      const referral=new URL(hotelBookingUrl(destination,hotel));
      assert.equal(referral.hostname,'ostrovok.tpk.mx');
      assert.equal(referral.searchParams.get('u'),hotel.booking.target);
      assert.equal(referral.searchParams.get('erid'),'2VtzqvE1cv3');
      const sub=referral.searchParams.get('sub_id');
      assert.ok(sub.includes(destination.replaceAll('-','_')));
      assert.ok(sub.includes(hotel.id.replaceAll('-','_')));
      assert.ok(!targets.has(hotel.booking.target),hotel.id);
      assert.ok(!subIds.has(sub),sub);
      targets.add(hotel.booking.target);subIds.add(sub);
    }
  }
  assert.equal(targets.size,700);assert.equal(subIds.size,700);
});

test('Хайнань ведёт к подборке Китая и показывает только три отеля Саньи',()=>{
  assert.equal(hotelCountrySlug('hainan'),'china');
  assert.equal(hotelCollection('hainan',{includeDraft:true}),HOTEL_COLLECTIONS.china);
  assert.equal(hotelCollection('hainan'),HOTEL_COLLECTIONS.china);
  assert.deepEqual(hotelGuideHubs('china').map(h=>h.slug),['china','hainan']);
  assert.deepEqual(hotelHubPicks('hainan',HOTEL_COLLECTIONS.china).map(h=>h.id),['edition-sanya','atlantis-sanya','mandarin-sanya']);
});

test('Австралийские хабы показывают отели своего региона и общую страновую подборку',()=>{
  assert.deepEqual(hotelGuideHubs('australia').map(h=>h.slug),['australia-east','australia-north']);
  for(const hub of ['australia-east','australia-north']){
    assert.equal(hotelCountrySlug(hub),'australia');
    assert.equal(hotelCollection(hub,{includeDraft:true}),HOTEL_COLLECTIONS.australia);
    const picks=hotelHubPicks(hub,HOTEL_COLLECTIONS.australia);
    assert.equal(picks.length,3);
    assert.ok(picks.every(h=>hub==='australia-north'?h.location==='Дарвин':h.location.startsWith('Сидней')||h.location.startsWith('Мельбурн')));
  }
});

test('Чили, Патагония и фьорды получают свою тройку отелей и одну национальную подборку',()=>{
  assert.deepEqual(hotelGuideHubs('chile').map(h=>h.slug),['chile','chile-patagonia','chile-fjords']);
  for(const [hub,location]of [['chile-patagonia','Пуэрто-Наталес'],['chile-fjords','Пуэрто-Монт']]){
    assert.equal(hotelCountrySlug(hub),'chile');
    const picks=hotelHubPicks(hub,HOTEL_COLLECTIONS.chile);
    assert.equal(picks.length,3);assert.ok(picks.every(h=>h.location===location));
  }
});

test('Все 70 подборок готовы к проверке публичного маршрута и имеют полные галереи',()=>{
  assert.equal(readyHotelCollections().length,70);
  for(const [destination,c]of Object.entries(HOTEL_COLLECTIONS)){
    assert.equal(c.status,'ready');assert.equal(hotelCollection(destination),c);
    for(const h of c.hotels){
      if(h.image){
        assert.ok(existsSync(new URL(`../src/assets/hotels/${h.image}`,import.meta.url)));
        assert.ok(credits[h.photoCreditKey||h.id]?.source);
      }
      const gallery=hotelGallery(destination,h);
      assert.ok(gallery.length>=3&&gallery.length<=5,`${destination}/${h.id}`);
      for(const photo of gallery){
        assert.ok(existsSync(new URL(`../src/assets/hotels/${photo.image}`,import.meta.url)));
        assert.ok(credits[photo.creditKey]?.source);
      }
    }
  }
});

test('Оба итальянских региональных хаба находят общую подборку страны с сохранением региональных карточек',()=>{
  for(const hub of ['italy-north','italy-south']){
    assert.equal(hotelCountrySlug(hub),'italy');
    assert.equal(hotelCollection(hub,{includeDraft:true}),HOTEL_COLLECTIONS.italy);
    assert.equal(hotelCollection(hub),HOTEL_COLLECTIONS.italy);
  }
  assert.deepEqual(hotelHubPicks('italy-north',HOTEL_COLLECTIONS.italy).map(h=>h.id),['grand-hotel-tremezzo','villa-serbelloni','aman-venice']);
  assert.deepEqual(hotelHubPicks('italy-south',HOTEL_COLLECTIONS.italy).map(h=>h.id),['hassler-roma','sirenuse-positano','santa-caterina-amalfi']);
  assert.deepEqual(hotelGuideHubs('italy').map(h=>h.slug),['italy-north','italy-south']);
  for(const country of Object.keys(HOTEL_COLLECTIONS))assert.ok(hotelGuideHubs(country).every(h=>h.cases.nom&&h.cases.loc),country);
});

test('Каждая карточка странового блока использует первый настоящий кадр своей галереи',()=>{
  for(const [country,c]of Object.entries(HOTEL_COLLECTIONS))for(const hub of hotelGuideHubs(country))for(const hotel of hotelHubPicks(hub.slug,c)){
    const first=hotelGallery(country,hotel)[0];
    assert.equal(hotel.image,first.image,`${hub.slug}/${hotel.id}`);
    assert.equal(hotel.photoAlt,first.alt);
    assert.ok(existsSync(new URL(`../src/assets/hotels/${hotel.image}`,import.meta.url)));
  }
});
