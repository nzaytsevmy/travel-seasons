import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inspectHotelViewport } from '../scripts/hotel-retina-loading.mjs';

function fixture(count, navigationError) {
  const events = [];
  let contexts = 0;
  const locator = indices => ({ indices, or(other) { return locator([...new Set([...indices, ...other.indices])]); } });
  return {
    events,
    browser: {
      async newContext(options) {
        const id = ++contexts;
        events.push(['context', id, options]);
        return {
          async newPage() {
            events.push(['page', id]);
            return {
              async goto(path) { events.push(['visit', id, path]); if (navigationError) throw navigationError; },
              locator() { return { async count() { return count; }, nth(index) { return locator([index]); } }; },
            };
          },
          async close() { events.push(['close', id]); },
        };
      },
    },
  };
}
test('Retina visits at the requested viewport and inspects every photo with at most four active checks', async () => {
  const { browser, events } = fixture(11);
  let active = 0, peak = 0;
  const seen = [];
  await inspectHotelViewport(browser, '/hotels/uae/', 1024, async group => Promise.all(group.indices.map(async index => {
    active++; peak = Math.max(peak, active); seen.push(index);
    await new Promise(resolve => setImmediate(resolve));
    active--;
  })));
  assert.deepEqual(events, [['context', 1, { viewport: { width: 1024, height: 900 }, screen: { width: 1024, height: 900 } }], ['page', 1], ['visit', 1, '/hotels/uae/'], ['close', 1]]);
  assert.equal(peak, 4); assert.equal(active, 0);
  assert.deepEqual(seen, Array.from({ length: 11 }, (_, index) => index));
});
test('Retina retains a failed photo assertion, settles its group and closes its context before stopping', async () => {
  const { browser, events } = fixture(11), seen = [];
  let active = 0;
  const failure = new Error('Actual file is smaller than the 2x crop');
  await assert.rejects(inspectHotelViewport(browser, '/hotels/uae/', 1024, async group => {
    const results = await Promise.allSettled(group.indices.map(async index => {
      active++; seen.push(index);
      await new Promise(resolve => setImmediate(resolve));
      active--;
      if (index === 1) throw failure;
    }));
    const rejected = results.find(result => result.status === 'rejected');
    if (rejected) throw rejected.reason;
  }), error => error === failure);
  assert.deepEqual(seen, [0, 1, 2, 3]); assert.equal(active, 0);
  assert.deepEqual(events.at(-1), ['close', 1]);
});
test('Retina rejects an empty page and still closes the context', async () => {
  const { browser, events } = fixture(0);
  await assert.rejects(inspectHotelViewport(browser, '/hotels/uae/', 1024, () => assert.fail('No image exists')), /No hotel photographs/);
  assert.deepEqual(events.at(-1), ['close', 1]);
});
test('Retina closes the context even when navigation fails', async () => {
  const failure = new Error('Navigation failed'), { browser, events } = fixture(11, failure);
  await assert.rejects(inspectHotelViewport(browser, '/hotels/uae/', 1024, () => assert.fail('Navigation never completed')), error => error === failure);
  assert.deepEqual(events.at(-1), ['close', 1]);
});
test('Retina never reuses a context across viewport visits', async () => {
  const { browser, events } = fixture(1);
  for (const width of [402, 767, 768, 1024, 1280, 1440, 1920]) await inspectHotelViewport(browser, '/hotels/uae/', width, async () => {});
  assert.deepEqual(events.filter(event => event[0] === 'context').map(event => event[2].viewport.width), [402, 767, 768, 1024, 1280, 1440, 1920]);
  for (let id = 1; id <= 7; id++) {
    const close = events.findIndex(event => event[0] === 'close' && event[1] === id);
    assert(close > events.findIndex(event => event[0] === 'visit' && event[1] === id));
    if (id < 7) assert(close < events.findIndex(event => event[0] === 'context' && event[1] === id + 1));
  }
});

test('Retina inspects four-photo locator groups without repeating one-image browser RPCs', async () => {
  const { browser } = fixture(11), seen = [];
  let calls = 0;
  await inspectHotelViewport(browser, '/hotels/georgia/', 1920, async group => {
    calls++;
    assert(group.indices.length >= 1 && group.indices.length <= 4);
    seen.push(...group.indices);
  });
  assert.equal(calls, 3, 'Eleven photos need three bounded locator groups, not eleven separate inspection RPC sequences');
  assert.deepEqual(seen, Array.from({ length: 11 }, (_, index) => index));
});
