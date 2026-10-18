import test from 'node:test';
import assert from 'node:assert/strict';
import { ostrovokCountry } from '../src/data/affiliate.js';
test('Саудовская Аравия открывает существующую страницу страны, а не 404',()=>{
  const link = new URL(ostrovokCountry('saudi-arabia','hotel_catalog'));
  assert.equal(new URL(link.searchParams.get('u')).pathname,'/hotel/saudi_arabia/');
  assert.equal(link.searchParams.get('erid'),'2VtzqvE1cv3');
  assert.equal(link.searchParams.get('sub_id'),'hotel_catalog');
});
