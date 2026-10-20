import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkHotelLanding, publishedBookings } from '../scripts/hotel-referral-audit.mjs';
import { addClickAttribution } from '../src/data/monetization.js';

test('rejects a different hotel even when the partner ID survives', () => {
  const target = 'https://ostrovok.ru/hotel/turkey/istanbul/mid8068982/shangrila/';
  const query = '?sub_id=generated-546042&erid=2VtzqvE1cv3';
  assert.equal(checkHotelLanding(target, target + query, 200).sameProperty, true);
  assert.equal(checkHotelLanding(target, target.replace('8068982', '8447154') + query, 200).sameProperty, false);
  assert.equal(checkHotelLanding(target, target + '?sub_id=generated-123456', 200).partnerIdPreserved, false);
});
test('requires the selected hotel name as well as its MID and partner ID', () => {
  const target = 'https://ostrovok.ru/hotel/turkey/istanbul/mid8068982/shangrila/';
  const final = target + '?sub_id=generated-546042&erid=2VtzqvE1cv3';
  assert.equal(checkHotelLanding(target, final, 200, 'Shangri-La Bosphorus', 'Another Hotel').nameVerified, false);
  assert.equal(checkHotelLanding(target, final, 200, 'Shangri-La Bosphorus', '').nameVerified, false);
  assert.equal(checkHotelLanding(target, final, 200, 'Shangri-La Bosphorus', 'Shangri-La Bosphorus, Istanbul').nameVerified, true);
});
test('reads the deployed affiliate shield instead of treating /go/ as the target', () => {
  const url = 'https://ostrovok.tpk.mx/xtyTcUcY?sub_id=hotels_test';
  const encoded = Buffer.from(url).toString('base64');
  assert.equal(publishedBookings(`<a class="hotel-entry-book" href="/go/" data-go="${encoded}" data-cta-id="hotels_test" rel="sponsored noopener">Book</a>`)[0].href, url);
});
test('hotel attribution preserves existing outer and merchant click IDs', () => {
  const target = 'https://ostrovok.ru/hotel/turkey/istanbul/mid8068982/shangrila/?click_id=merchant_existing';
  const before = new URL('https://ostrovok.tpk.mx/xtyTcUcY');
  before.searchParams.set('u', target);
  before.searchParams.set('click_id', 'partner_existing');
  before.searchParams.set('erid', '2VtzqvE1cv3');
  const after = new URL(addClickAttribution(before.href, {
    ctaId: 'hotels_turkey_shangri_la', experimentId: 'baseline', variant: 'na', clickId: 'c00112233445566778899',
  }));
  assert.equal(after.searchParams.get('click_id'), 'partner_existing');
  assert.equal(after.searchParams.get('u'), target);
  assert.equal(after.searchParams.get('erid'), '2VtzqvE1cv3');
  assert.ok(after.searchParams.get('sub_id').includes('c00112233445566778899'));
});
