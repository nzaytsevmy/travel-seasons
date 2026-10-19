import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectNativePhotoSource, selectNativePhotoSources, sourceDoesNotEnlarge } from '../scripts/hotel-native-source.mjs';
const photo = { sourcePhoto: 'https://cdn.ostrovok.ru/t/640x400/content/photo.JPEG' };
test('never stretches the known 650px miniature into a 2x gallery original', () => {
  assert.equal(selectNativePhotoSource({ ...photo, publisherWidth: 650, publisherHeight: 450 }, 2000, 1125), null);
});
test('a real 4085px original may be downsampled to the supported 2600px variant', () => {
  const selected = selectNativePhotoSource({ ...photo, publisherWidth: 4085, publisherHeight: 2725 }, 2000, 1125);
  assert.equal(selected.sourceVariant, '2600x1240');
  assert.equal(sourceDoesNotEnlarge({ ...selected, width: 2600, height: 1734 }), true);
});
test('a policy label cannot disguise a forced-width thumbnail as shrink-only', () => {
  assert.equal(sourceDoesNotEnlarge({ sourcePolicy: 'native-safe2048-v1',
    sourcePhoto: 'https://cdn.ostrovok.ru/t/2600x1240/content/photo.JPEG' }), false);
});
test('a 2000px original uses shrink-only delivery and cannot authorize a forced 2600px image', () => {
  const selected = selectNativePhotoSource({ ...photo, publisherWidth: 2000, publisherHeight: 1333 }, 2000, 1125);
  assert.equal(selected.sourceVariant, '2048x2048');
  assert.equal(sourceDoesNotEnlarge({ ...selected, sourceVariant: '2600x1240', width: 2600, height: 1733 }), false);
});
test('a native 1280x960 photo covers the body crop without forced enlargement', () => {
  const selected = selectNativePhotoSource({ ...photo, publisherWidth: 1280, publisherHeight: 960 }, 1266, 950);
  assert.equal(selected.sourceVariant, '1920x1080');
});
test('the country lead crop cannot rely on the legacy variant capped at 1080px high', () => {
  const selected = selectNativePhotoSource({ ...photo, publisherWidth: 2000, publisherHeight: 1500 }, 1540, 1155);
  assert.equal(selected.sourceVariant, '1920x');
});
test('forced one-axis variants are available only below verified native bounds', () => {
  const wide = selectNativePhotoSources({ ...photo, publisherWidth: 2000, publisherHeight: 1500 }, 1540, 1155);
  assert.ok(wide.some(row => row.sourceVariant === '1920x'));
  assert.equal(wide.some(row => row.sourceVariant === 'x1920'), false);
  const small = selectNativePhotoSources({ ...photo, publisherWidth: 1280, publisherHeight: 960 }, 1200, 900);
  assert.equal(small.some(row => ['1920x', 'x1920'].includes(row.sourceVariant)), false);
  for (const sourceVariant of ['1920x', 'x1920']) assert.equal(sourceDoesNotEnlarge({
    sourcePolicy: 'publisher-native-bounds-v2', sourceVariant,
    sourcePhoto: `https://cdn.ostrovok.ru/t/${sourceVariant}/content/photo.JPEG`,
    width: 650, height: 450, publisherWidth: 650, publisherHeight: 450,
  }), false);
});
test('transport fallbacks all preserve photo identity and the native 2x crop', () => {
  const sources = selectNativePhotoSources({ ...photo, publisherWidth: 4000, publisherHeight: 3000 }, 1327, 995);
  assert.deepEqual(sources.map(source => source.sourceVariant), ['2600x1240', '1920x1080', '1920x', 'x1920', '2048x2048']);
  for (const source of sources) assert.ok(source.sourcePhoto.endsWith('/content/photo.JPEG'));
  assert.deepEqual(selectNativePhotoSources({ ...photo, publisherWidth: 1280, publisherHeight: 960 }, 1327, 995), []);
});
