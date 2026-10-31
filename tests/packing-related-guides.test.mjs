import test from 'node:test';
import assert from 'node:assert/strict';
import * as advice from '../src/data/packing-page-advice.js';
import { DIRECTIONS, MONTHS } from '../src/data/directions.js';
import { existsSync } from 'node:fs';

test('Egypt next steps include the winter season and other destinations stay explicitly selected', () => {
  assert.equal(typeof advice.getPackingRelatedGuides, 'function');
  const targets = ['/blog/hurghada-sharm-2026/', '/blog/kair-iz-hurgady/', '/blog/bolshoy-egipetskiy-muzey/'];
  for (const month of [undefined, 'october', 'november', 'december', 'january', 'february']) {
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
      if (['georgia', 'armenia', 'china', 'hainan', 'nepal'].includes(country)) continue;
      if (country === 'egypt' && [undefined, 'october', 'november', 'december', 'january', 'february'].includes(month)) continue;
      assert.deepEqual(advice.getPackingRelatedGuides(country, month), [], `${country}/${month}`);
    }
  }
  for (const args of [[], ['unknown'], ['egypt', 'unknown'], ['egypt', ''], ['egypt', null]]) {
    assert.deepEqual(advice.getPackingRelatedGuides(...args), []);
  }
});

test('selected purchase paths resolve to existing content and do not claim booking conditions', () => {
  for (const country of ['egypt', 'georgia', 'armenia', 'china', 'hainan', 'nepal']) {
    const guides = advice.getDestinationPlanningGuides(country);
    assert.ok(guides.length >= 2);
    assert.equal(new Set(guides.map(item => item.href)).size, guides.length);
    for (const item of guides) {
      assert.ok(item.note && item.label);
      assert.doesNotMatch(item.note, /гарант|бесплатная отмена|любой полис/i);
      if (item.href.startsWith('/blog/')) {
        const stem = item.href.replace(/^\/blog\//, '').replace(/\/$/, '');
        assert.ok(['md', 'mdx'].some(ext => existsSync(new URL(`../src/content/blog/${stem}.${ext}`, import.meta.url))), item.href);
      } else assert.match(item.href, /^\/hotels\/armenia\/$/);
    }
    guides[0].note = 'mutated';
    assert.notEqual(advice.getDestinationPlanningGuides(country)[0].note, 'mutated');
  }
  for (const key of ['unknown', '__proto__', 'constructor']) assert.deepEqual(advice.getDestinationPlanningGuides(key), []);
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
