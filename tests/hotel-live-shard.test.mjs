import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hotelShardTitles, hotelTitlePattern } from '../scripts/run-hotel-live-shard.mjs';

test('Hotel live quarters preserve every unique case exactly once and balance Retina cases', () => {
  const titles = [...Array.from({ length: 217 }, (_, i) => `journey ${i}`), ...Array.from({ length: 70 }, (_, i) => `Retina ${i}`)];
  const parts = [1, 2, 3, 4].map(index => hotelShardTitles(titles, index));
  assert.deepEqual(parts.map(part => part.length), [72, 72, 72, 71]);
  assert.deepEqual(parts.map(part => part.filter(title => title.startsWith('Retina')).length), [17, 18, 18, 17]);
  assert.deepEqual(parts.flat().sort(), [...titles].sort());
  assert.equal(new Set(parts.flat()).size, titles.length);
});
test('Hotel live quarters reject invalid indexes and duplicate identities', () => {
  for (const index of [0, 5, 1.5, NaN]) assert.throws(() => hotelShardTitles(['a', 'b', 'c', 'd'], index));
  assert.throws(() => hotelShardTitles(['a', 'b', 'c', 'a'], 1), /duplicate/);
});
test('Hotel selector escapes punctuation and anchors each exact title', () => {
  const titles = ['Retina 2×: ОАЭ (hotel + pool)?', 'journey [a.b] $20'];
  const pattern = new RegExp(hotelTitlePattern(titles));
  for (const title of titles) {
    assert(pattern.test(`webkit-desktop tests/hotel.spec.ts ${title}`));
    assert(!pattern.test(`${title} unrelated case`));
  }
  assert(!pattern.test('journey aXb $20'));
});
test('Hotel selection never accepts an empty inventory', () => {
  assert.throws(() => hotelShardTitles([], 1));
  assert.throws(() => hotelTitlePattern([]));
});
