import test from 'node:test';
import assert from 'node:assert/strict';
import * as advice from '../src/data/packing-page-advice.js';
import { DIRECTIONS, MONTHS } from '../src/data/directions.js';

test('Egypt next steps appear only on the country page, October and November', () => {
  assert.equal(typeof advice.getPackingRelatedGuides, 'function');
  const targets = ['/blog/hurghada-sharm-2026/', '/blog/kair-iz-hurgady/', '/blog/bolshoy-egipetskiy-muzey/'];
  for (const month of [undefined, 'october', 'november']) {
    const links = advice.getPackingRelatedGuides('egypt', month);
    assert.deepEqual(links.map(({ href }) => href), targets);
    for (const item of links) {
      assert.ok(item.label.trim());
      assert.ok(item.note.trim());
      assert.deepEqual(Object.keys(item).sort(), ['href', 'label', 'note']);
    }
  }
  for (const { slug: country } of DIRECTIONS) {
    for (const month of [undefined, ...MONTHS.map(({ slug }) => slug)]) {
      if (country === 'egypt' && [undefined, 'october', 'november'].includes(month)) continue;
      assert.deepEqual(advice.getPackingRelatedGuides(country, month), [], `${country}/${month}`);
    }
  }
  for (const args of [[], ['unknown'], ['egypt', 'unknown'], ['egypt', ''], ['egypt', null]]) {
    assert.deepEqual(advice.getPackingRelatedGuides(...args), []);
  }
});

test('next steps do not enable weather advice or mutate later visitors’ links', () => {
  assert.equal(typeof advice.getPackingRelatedGuides, 'function');
  assert.equal(advice.getPackingPageAdvice('egypt'), null);
  assert.equal(advice.getPackingPageAdvice('egypt', 'september'), null);
  const before = structuredClone(advice.getPackingPageAdvice('egypt', 'november'));
  const links = advice.getPackingRelatedGuides('egypt', 'november');
  links[0].href = '/wrong/';
  links.pop();
  assert.equal(advice.getPackingRelatedGuides('egypt', 'november').length, 3);
  assert.equal(advice.getPackingRelatedGuides('egypt', 'november')[0].href, '/blog/hurghada-sharm-2026/');
  assert.deepEqual(advice.getPackingPageAdvice('egypt', 'november'), before);
});
