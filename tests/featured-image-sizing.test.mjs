import test from 'node:test';
import assert from 'node:assert/strict';
import { featuredImageSizes, featuredImageWidths } from '../src/data/featured-image-sizing.js';

test('featured image sizes account for a wide real cover and the desktop card', () => {
  const [mobile, desktop] = featuredImageSizes({ width: 1920, height: 689 }).split('), ');
  const match = mobile.match(/calc\(([\d.]+)vw - ([\d.]+)rem - ([\d.]+)px$/);
  assert.ok(match, 'mobile sizes must contain a responsive calc');
  const [, vw, rem, px] = match.map(Number);
  const factor = (1920 / 689) / (16 / 10);
  for (const width of [360, 402, 680]) {
    const declared = width * vw / 100 - 16 * rem - px;
    const required = (width - 2 * 16 - 2) * factor;
    assert.ok(declared >= required - 0.01, `underestimates crop at ${width}px`);
  }
  assert.ok(Number.parseFloat(desktop) >= 440 * 1920 / 689);
});

test('a narrower image keeps the mobile box width', () => {
  assert.match(featuredImageSizes({ width: 1920, height: 1440 }), /calc\(100vw - 2rem - 2px\)/);
});

test('candidate widths never upscale the original and include its full resolution', () => {
  assert.deepEqual(featuredImageWidths({ width: 1000 }), [400, 600, 720, 860, 1000]);
  assert.deepEqual(featuredImageWidths({ width: 300 }), [300]);
  assert.equal(featuredImageWidths({ width: 1920 }).at(-1), 1920);
  assert.equal(featuredImageWidths({ width: 2400 }).at(-1), 2400);
});
