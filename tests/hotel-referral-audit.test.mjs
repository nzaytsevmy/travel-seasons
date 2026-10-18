import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkHotelLanding, publishedBookings } from '../scripts/hotel-referral-audit.mjs';

test('rejects a different hotel even when the partner ID survives', () => {
  const target = 'https://ostrovok.ru/hotel/turkey/istanbul/mid8068982/shangrila/';
  const query = '?sub_id=generated-546042&erid=2VtzqvE1cv3';
  assert.equal(checkHotelLanding(target, target + query, 200).sameProperty, true);
  assert.equal(checkHotelLanding(target, target.replace('8068982', '8447154') + query, 200).sameProperty, false);
  assert.equal(checkHotelLanding(target, target + '?sub_id=generated-123456', 200).partnerIdPreserved, false);
});
test('reads the deployed affiliate shield instead of treating /go/ as the target', () => {
  const url = 'https://ostrovok.tpk.mx/xtyTcUcY?sub_id=hotels_test';
  const encoded = Buffer.from(url).toString('base64');
  assert.equal(publishedBookings(`<a class="hotel-entry-book" href="/go/" data-go="${encoded}" data-cta-id="hotels_test" rel="sponsored noopener">Book</a>`)[0].href, url);
});
