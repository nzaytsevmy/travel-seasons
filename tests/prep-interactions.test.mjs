import assert from 'node:assert/strict';
import test from 'node:test';
import { recordPrepInteraction } from '../src/scripts/prep-interactions.js';

test('preparation interaction requires explicit consent and tolerates blocked storage', () => {
  const calls = [];
  let consent = null;
  let blocked = false;
  const previousWindow = globalThis.window;
  globalThis.window = {
    __analyticsEnabled: true,
    ym: (...args) => calls.push(args),
    localStorage: { getItem: () => {
      if (blocked) throw new Error('Storage unavailable');
      return consent;
    } },
  };
  try {
    assert.equal(recordPrepInteraction('packing_copy'), false);
    consent = 'denied';
    assert.equal(recordPrepInteraction('packing_copy'), false);
    blocked = true;
    assert.equal(recordPrepInteraction('packing_copy'), false);
    assert.deepEqual(calls, []);
    blocked = false;
    consent = 'granted';
    assert.equal(recordPrepInteraction('packing_copy'), true);
    assert.deepEqual(calls, [[95832375, 'params', { travel_prep: { packing_copy: 1 } }]]);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});
