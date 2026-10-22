import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inspectHotelViewport } from '../scripts/hotel-retina-loading.mjs';

function fixture(count) {
  const events = [];
  return {
    events,
    page: {
      async setViewportSize(value) { events.push(['viewport', value.width]); },
      async goto(path) { events.push(['visit', path]); },
      locator() { return { async count() { return count; }, nth(index) { return index; } }; },
    },
  };
}
test('Retina visits at the requested viewport and inspects every photo with at most four active checks', async () => {
  const { page, events } = fixture(11);
  let active = 0, peak = 0;
  const seen = [];
  await inspectHotelViewport(page, '/hotels/uae/', 1024, async index => {
    active++; peak = Math.max(peak, active); seen.push(index);
    await new Promise(resolve => setImmediate(resolve));
    active--;
  });
  assert.deepEqual(events, [['viewport', 1024], ['visit', '/hotels/uae/']]);
  assert.equal(peak, 4);
  assert.equal(active, 0);
  assert.deepEqual(seen, Array.from({ length: 11 }, (_, index) => index));
});
test('Retina retains a failed photo assertion, settles its group and never starts the next group', async () => {
  const { page } = fixture(11), seen = [];
  let active = 0;
  const failure = new Error('Actual file is smaller than the 2x crop');
  await assert.rejects(inspectHotelViewport(page, '/hotels/uae/', 1024, async index => {
    active++; seen.push(index);
    await new Promise(resolve => setImmediate(resolve));
    active--;
    if (index === 1) throw failure;
  }), error => error === failure);
  assert.deepEqual(seen, [0, 1, 2, 3]);
  assert.equal(active, 0);
});
test('Retina rejects a page without photographs', async () => {
  const { page } = fixture(0);
  await assert.rejects(inspectHotelViewport(page, '/hotels/uae/', 1024, () => assert.fail('No image exists')), /No hotel photographs/);
});
