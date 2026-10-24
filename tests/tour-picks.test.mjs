import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { tourErrors, tourCollection, tourAffiliateUrl, tourPrice, tourRatingLabel, TOUR_PICKS } from '../src/data/tour-picks.js';
import { youtravelDeep, youtravelCountry } from '../src/data/affiliate.js';
import { isGenericAffiliateUrl, addCtaAttribution } from '../src/data/monetization.js';
import { prepareAffiliateLinks, monetizationPayload } from '../src/scripts/monetization-tracking.js';

const now = new Date('2026-10-24T12:00:00Z');
const valid = () => ({ id:'tokyo-walk', status:'approved', partner:'tripster', destination:'japan', title:'Токио пешком', city:'Токио', duration:'4 часа', language:'Русский', reason:'Сады и кварталы', experienceKey:'tokyo-gardens', kind:'excursion', url:'https://experience.tripster.ru/experience/13237/', rating:4.9, reviewCount:40, ratingScope:'tour', checks:{ source:'https://experience.tripster.ru/experience/13237/', method:'primary-page', checkedAt:'2026-10-24', reviewAfter:'2026-11-24', program:'Программа прочитана',positiveReviews:'Прочитаны отзывы',criticalReviews:'Негативные отзывы проверены',organizer:'Организатор проверен',payment:'Условия оплаты прочитаны',cancellation:'Условия отмены прочитаны',geography:'Старт в Токио' } });

test('registry audit checks actual destination IDs and editorial photographs', () => {
  assert.match(execFileSync(process.execPath, ['scripts/tour-picks-audit.mjs'], {cwd:new URL('../',import.meta.url),encoding:'utf8'}), /0 errors/);
});

test('approved offers require primary evidence, tour-specific reviews and correct target', () => {
  assert.deepEqual(tourErrors(valid()), []);
  for (const change of [{ratingScope:'organizer'},{reviewCount:29},{rating:4.6},{url:'https://experience.tripster.ru/experience/Tokyo/'},{url:'https://evil.test/experience/13237/'},{url:'javascript:alert(1)'},{checks:{}}]) {
    assert.ok(tourErrors({...valid(),...change}).length,JSON.stringify(change));
  }
  for (const offer of TOUR_PICKS.filter(t=>t.status==='approved')) assert.deepEqual(tourErrors(offer),[],offer.id);
  assert.ok(tourErrors({...valid(),checks:{...valid().checks,program:42}}).includes('checks.program'));
  assert.ok(tourErrors({...valid(),checks:{...valid().checks,checkedAt:'2026-02-30'}}).includes('evidence'));
});

test('selection excludes expired, future, duplicate, unapproved and unrelated offers', () => {
  const a=valid();
  const expired={...a,id:'expired',checks:{...a.checks,reviewAfter:'2026-10-24'}};
  const future={...a,id:'future',checks:{...a.checks,checkedAt:'2026-10-25'}};
  const records=[a,{...a,id:'duplicate'},expired,future,{...a,status:'candidate'},{...a,destination:'bali'}];
  assert.deepEqual(tourCollection('japan',{now,records}).map(t=>t.id),[a.id]);
  assert.equal(tourCollection('japan',{now,records:Array.from({length:12},(_,i)=>({...a,id:`tour-${i}`,experienceKey:`tour-${i}`}))}).length,10);
});

test('sparse-review programmes require corroborated reputation and keep statistics distinct', () => {
  const tour={...valid(),ratingScope:'organizer',rating:4.9,reviewCount:80,tourReviewCount:0,quality:{mode:'combined',organizerRating:4.9,organizerReviewCount:80,organizerUrl:'https://experience.tripster.ru/guide/123/',reason:'Проверены маршрут, условия и независимые отзывы путешественников об организаторе.',sources:[{url:valid().url,kind:'programme',checkedAt:'2026-10-24',finding:'Программа и условия'},{url:'https://experience.tripster.ru/guide/123/',kind:'traveler-reviews',checkedAt:'2026-10-24',finding:'Отзывы о нескольких поездках организатора'}]}};
  assert.deepEqual(tourErrors(tour),[]);
  assert.equal(tourRatingLabel(tour),'Организатор');
  assert.ok(tourErrors({...tour,reviewCount:81}).includes('organizer-statistics'));
  assert.ok(tourErrors({...tour,quality:{...tour.quality,sources:[tour.quality.sources[0]]}}).includes('quality-sources'));
  assert.ok(tourErrors({...tour,quality:undefined}).includes('tour-reviews'));
});

test('Travelpayouts links keep erid and per-offer attribution outside encoded target', () => {
  for (const [partner,url] of [['tripster',valid().url],['sputnik8','https://www.sputnik8.com/ru/istanbul/activities/12345-city-walk'],['tiqets','https://www.tiqets.com/en/tokyo-attractions-c72181/tickets-for-tower-p12345/']]) {
    const link=tourAffiliateUrl({...valid(),partner,url},'/japan/');
    const parsed=new URL(link.href);
    assert.equal(parsed.searchParams.get('u'),url);
    assert.ok(parsed.searchParams.get('erid'));
    assert.equal(parsed.searchParams.get('sub_id'),link.ctaId);
  }
  assert.throws(()=>tourAffiliateUrl({...valid(),url:'https://evil.test/'},'/japan/'));
});

test('YouTravel offer survives browser preparation without replacement by country catalogue', () => {
  const tour={...valid(),partner:'youtravel',kind:'multiday',url:'https://youtravel.me/tours/34004/невероятный_кыргызстан_читай_отзывы_'};
  const link=tourAffiliateUrl(tour,'/kyrgyzstan/');
  assert.equal(isGenericAffiliateUrl(link.href,'youtravel'),false);
  const rel=new Set(['sponsored']);
  const anchor={href:link.href,dataset:{ctaId:link.ctaId,tourId:tour.id,placement:'tour_picks',destination:'kyrgyzstan'},textContent:'Посмотреть тур',relList:{contains:x=>rel.has(x),add:x=>rel.add(x)},classList:{contains:()=>false},closest:()=>null};
  const doc={body:{dataset:{}},querySelectorAll:()=>[anchor]};anchor.ownerDocument=doc;
  prepareAffiliateLinks(doc,'/kyrgyzstan/');
  assert.equal(new URL(anchor.href).searchParams.get('redirect'),new URL(link.href).searchParams.get('redirect'));
  assert.equal(new URL(addCtaAttribution(link.href,'different_tour')).searchParams.get('sub1'),'different_tour');
  assert.equal(monetizationPayload(anchor,'/kyrgyzstan/').tour_id,tour.id);
  assert.equal(monetizationPayload(anchor,'/kyrgyzstan/').partner_join,'metrika_only');
});

test('stale prices disappear without suppressing the reviewed tour', () => {
  const tour={...valid(),price:{rub:12000,unit:'group',checkedAt:'2026-10-24',reviewAfter:'2026-10-31'}};
  assert.match(tourPrice(tour,now),/за группу/);
  assert.equal(tourPrice(tour,new Date('2026-10-31')),'Уточнить стоимость');
  assert.equal(tourPrice(valid(),now),'Уточнить стоимость');
});

test('small samples need documented history or verified identity and disclose the external rating source', () => {
  const record=structuredClone(TOUR_PICKS.find(t=>t.id==='youtravel-76727-antarctica'));
  assert.deepEqual(tourErrors(record),[]);
  assert.equal(tourRatingLabel(record),'Организатор (Tripster)');
  const shortHistory={...record,quality:{...record.quality,organizerSince:'2026-01-01'}};
  assert.ok(tourErrors(shortHistory).includes('organizer-reputation'));
  for (const sources of [null, {}, [null,null], [{url:record.url},null]]) {
    assert.ok(tourErrors({...record,quality:{...record.quality,sources}}).includes('quality-sources'));
  }
  const mismatch={...record,ratingScope:'tour',tourReviewCount:0};
  assert.ok(tourErrors(mismatch).includes('tour-review-count'));
  const futureEvidence=structuredClone(record);
  futureEvidence.quality.sources[0].checkedAt='2026-10-25';
  assert.ok(tourErrors(futureEvidence).includes('quality-sources'));
});


test('Affise product and country deep links preserve merchant attribution and unescaped macros', () => {
  for (const href of [youtravelDeep('https://youtravel.me/tours/34004/example','tour_probe'),youtravelCountry('japan','tour_probe')]) {
    const affiliate=new URL(href);
    const redirect=affiliate.searchParams.get('redirect');
    const target=new URL(redirect);
    assert.equal(target.searchParams.get('partner'),'affise');
    assert.equal(target.searchParams.get('sid'),affiliate.searchParams.get('pid'));
    assert.equal(target.searchParams.get('utm_campaign'),'affise');
    assert.equal(target.searchParams.get('click_id'),'{clickid}');
    assert.match(redirect,/click_id=\{clickid\}/);
    assert.match(redirect,/utm_content=\{sub1\}/);
    assert.equal(affiliate.searchParams.get('sub1'),'tour_probe');
  }
  for (const target of ['https://evil.test/tours/1/','https://youtravel.me@evil.test/tours/1/','https://youtravel.me/tours/1/?click_id=fake']) assert.throws(()=>youtravelDeep(target,'probe'));
});
