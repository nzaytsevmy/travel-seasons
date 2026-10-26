import test from 'node:test';
import assert from 'node:assert/strict';
import { preferredTourCountry } from '../src/data/affiliate.js';

test('Sputnik gets the verified destination catalogue and its own tracking',()=>{
  const offer=preferredTourCountry('bali','sputnik_preference_probe');
  assert.equal(offer.partner,'sputnik8');
  assert.equal(offer.kind,'excursion');
  const link=new URL(offer.href);
  assert.equal(link.host,'sputnik8.tpk.mx');
  assert.equal(link.searchParams.get('u'),'https://www.sputnik8.com/ru/bali');
  assert.equal(link.searchParams.get('sub_id'),'sputnik_preference_probe');
  assert.equal(link.searchParams.get('erid'),'2Vtzqugsszo');
});

test('uncovered expedition regions preserve a clearly identified multi-day fallback',()=>{
  for(const slug of ['antarctica','raja-ampat','japan-hokkaido','chile-patagonia','chile-fjords']){
    const offer=preferredTourCountry(slug,'fallback_probe');
    assert.equal(offer.partner,'youtravel',slug);
    assert.equal(offer.kind,'multiday',slug);
    assert.equal(new URL(offer.href).host,'travelme.g2afse.com');
  }
});
