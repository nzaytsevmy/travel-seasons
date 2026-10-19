import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectNativePhotoSource, sourceDoesNotEnlarge } from '../scripts/hotel-native-source.mjs';
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
