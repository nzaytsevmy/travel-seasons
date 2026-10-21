import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';

// Exercise the actual browser callback, without a browser or a second copy of
// its readiness logic. The browser matrix still checks every real photograph.
const source = readFileSync(new URL('./hotel-retina.spec.ts', import.meta.url), 'utf8');
const marker = 'images.evaluateAll(async (nodes, cachedDimensions) => {';
const start = source.indexOf(marker);
const end = source.indexOf('}, [...decodedImages]);', start);
assert(start >= 0 && end > start && source.indexOf(marker, start + 1) === -1);
const callback = stripTypeScriptTypes(`(${source.slice(start + 'images.evaluateAll('.length, end + 1)})`);

async function inspect({ complete = true, naturalWidth = 400, pixels = [800, 600], failDecode = false, changeSource = false } = {}) {
  let probes = 0;
  const image = {
    currentSrc: 'https://example.test/photo.webp', src: 'https://example.test/photo.webp',
    complete, naturalWidth, getBoundingClientRect: () => ({ width: 400, height: 300 }),
  };
  class ImageProbe {
    naturalWidth = pixels[0];
    naturalHeight = pixels[1];
    async decode() {
      probes++;
      if (changeSource) image.currentSrc = 'https://example.test/new-photo.webp';
      if (failDecode) throw new Error('EncodingError');
    }
  }
  const evaluate = runInNewContext(callback, { Image: ImageProbe });
  return { result: await evaluate([image], []), probes };
}

test('Retina waits for the displayed request before creating a decode probe', async () => {
  const { result, probes } = await inspect({ complete: false });
  assert.equal(probes, 0, 'Do not race an in-flight responsive request with a second decoder');
  assert.equal(result.pending.length, 1);
});
test('Retina rejects a completed broken displayed image before probing', async () => {
  const { result, probes } = await inspect({ naturalWidth: 0 });
  assert.equal(probes, 0);
  assert.equal(result.pending.length, 1);
});
test('Retina decodes a ready image and verifies its actual pixels', async () => {
  const { result, probes } = await inspect();
  assert.equal(probes, 1);
  assert.equal(result.pending.length, 0);
  assert.equal(result.decoded[0][1].width, 800);
});
test('Retina still rejects a source smaller than the displayed 2x crop', async () => {
  const { result } = await inspect({ pixels: [640, 480] });
  assert.equal(result.pending.length, 1);
  assert.match(result.pending[0], /does not yet cover/);
});
test('Retina still rejects an actual decode failure', async () => {
  const { result } = await inspect({ failDecode: true });
  assert.equal(result.pending.length, 1);
  assert.match(result.pending[0], /EncodingError/);
});
test('Retina still rejects a source that changes while decoding', async () => {
  const { result } = await inspect({ changeSource: true });
  assert.equal(result.pending.length, 1);
});
