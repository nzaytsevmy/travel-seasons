import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coverDensity, galleryFrame, originalPhotoUrl } from '../scripts/hotel-photo-quality.mjs';

test('rejects the published 640px thumbnail enlarged in the first gallery', () => {
  const frame = galleryFrame(1200, true);
  assert.ok(coverDensity(640, 400, frame.width, frame.height) < 1);
  assert.ok(coverDensity(2600, 1733, frame.width, frame.height) >= 2);
});
test('checks cropped height as well as image width', () => {
  assert.ok(coverDensity(1600, 900, 650, 487.5) < 2);
  assert.ok(coverDensity(1920, 1440, 650, 487.5) >= 2);
});
test('uses the verified shrink-only source size and preserves the exact photo identity', () => {
  assert.equal(originalPhotoUrl('https://cdn.ostrovok.ru/t/640x400/content/aa/photo.jpeg'),
    'https://cdn.ostrovok.ru/t/2048x2048/content/aa/photo.jpeg');
  assert.equal(originalPhotoUrl('https://assets.example.com/photo.jpg'), 'https://assets.example.com/photo.jpg');
});
