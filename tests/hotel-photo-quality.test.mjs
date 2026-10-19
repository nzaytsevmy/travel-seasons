import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coverDensity, galleryFrame, photoFrames, originalPhotoUrl } from '../scripts/hotel-photo-quality.mjs';
import { hotelCollection, hotelGallery } from '../src/data/hotels.js';

test('rejects the published 640px thumbnail enlarged in the first gallery', () => {
  const frame = galleryFrame(1200, true);
  assert.ok(coverDensity(640, 400, frame.width, frame.height) < 1);
  assert.ok(coverDensity(2600, 1733, frame.width, frame.height) >= 2);
});
test('checks cropped height as well as image width', () => {
  assert.ok(coverDensity(1600, 900, 650, 487.5) < 2);
  assert.ok(coverDensity(1920, 1440, 650, 487.5) >= 2);
});
test('covers the wider single-column frame immediately before the tablet breakpoint', () => {
  const edge = galleryFrame(767, false);
  const desktop = galleryFrame(1280, false);
  assert.ok(coverDensity(1280, 960, desktop.width, desktop.height) >= 2);
  assert.ok(coverDensity(1280, 960, edge.width, edge.height) < 2);
});
test('uses the accepted 16px mobile page edges in the gallery at 767px', () => {
  assert.ok(Math.abs(galleryFrame(767, false).width - (767 - 32) * .92) < .001);
});
test('rejects a crop that only fits the old narrower hub-padding assumption', () => {
  const hotel = hotelCollection('oman').hotels[0];
  const photo = hotelGallery('oman', hotel)[0];
  const hub = photoFrames({country:'oman',hotelId:hotel.id,image:photo.image,lead:true})
    .filter(frame => frame.viewport === 1280).at(-1);
  assert.ok(Math.abs(hub.width - (1280 - 48 - 32) * 1.8 / 2.8) < .001);
  assert.ok(coverDensity(2000, 1150, hub.width, hub.height) < 2);
});
test('uses the verified shrink-only source size and preserves the exact photo identity', () => {
  assert.equal(originalPhotoUrl('https://cdn.ostrovok.ru/t/640x400/content/aa/photo.jpeg'),
    'https://cdn.ostrovok.ru/t/2048x2048/content/aa/photo.jpeg');
  assert.equal(originalPhotoUrl('https://assets.example.com/photo.jpg'), 'https://assets.example.com/photo.jpg');
});
