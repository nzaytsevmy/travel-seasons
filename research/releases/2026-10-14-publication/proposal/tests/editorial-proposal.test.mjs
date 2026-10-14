import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEditorialInventory, validateEditorialConfig } from '../scripts/news-cap.mjs';
import { latestFeedCheck } from '../src/data/news-feed-check.mjs';
const config = { selectionMode: 'editorial', targetPerDay: null, maxPerDay: null, minScore: 3, paused: false };
const day = '2026-10-14';
const note = (i, score = 4, added = day) => ({ file: `src/content/news/story-${String(i).padStart(2, '0')}.md`, note: { data: { score, added, checked: day, topic: 'nature' } } });
const inventory = (candidates = [], tracked = [], cfg = config) => buildEditorialInventory({ config: cfg, candidates, tracked, day });
test('zero candidates: no invented deficit or publication', () => {
  const r = inventory(); assert.equal(r.candidate_count, 0); assert.equal(r.publication, 'NOT_ATTEMPTED');
  for (const key of ['target', 'deficit', 'published']) assert.equal(key in r, false);
});
test('seven strong candidates all survive', () => {
  const r = inventory(Array.from({ length: 7 }, (_, i) => note(i)));
  assert.equal(r.ready_for_source_and_independent_review.length, 7); assert.deepEqual(r.deleted_files, []);
});
test('tracked files do not consume editorial slots', () => {
  const r = inventory([note(20)], Array.from({ length: 10 }, (_, i) => note(i)));
  assert.equal(r.tracked_for_day.length, 10); assert.equal(r.ready_for_source_and_independent_review.length, 1);
});
test('one candidate creates no padding requirement', () => { const r = inventory([note(1)]); assert.equal(r.candidate_count, 1); assert.equal('deficit' in r, false); });
test('score floor is preserved without destructive filtering', () => {
  const r = inventory([note(1, 2), note(2, 3)]); assert.equal(r.below_score_floor.length, 1);
  assert.equal(r.ready_for_source_and_independent_review.length, 1); assert.deepEqual(r.deleted_files, []);
});
test('unscored is not independently reviewed', () => {
  const r = inventory([note(1, null)]); assert.equal(r.unscored.length, 1);
  assert.equal(r.ready_for_source_and_independent_review.length, 0); assert.equal(r.independent_review, 'NOT_VERIFIED_BY_INVENTORY');
});
test('legacy quota configuration is rejected', () => {
  assert.throws(() => inventory([], [], { ...config, maxPerDay: 5 }), /must not retain/);
  assert.throws(() => inventory([], [], { ...config, targetPerDay: 5 }), /must not retain/);
});
test('editorial mode must be explicit', () => assert.throws(() => validateEditorialConfig({ minScore: 3 }), /selectionMode/));
test('migration cannot lower score floor', () => assert.throws(() => inventory([], [], { ...config, minScore: 2 }), /score floor/));
test('invalid scores are rejected', () => { for (const v of [-1, 6, NaN, '4']) assert.throws(() => inventory([note(1, v)]), /Invalid score/); });
test('duplicate paths are rejected', () => assert.throws(() => inventory([note(1)], [note(1)]), /Duplicate file/));
test('inputs are not mutated', () => { const notes = [note(2, 3), note(1, 5)]; const old = JSON.stringify(notes); inventory(notes); assert.equal(JSON.stringify(notes), old); });
test('score ties are deterministic', () => assert.deepEqual(inventory([note(2), note(1)]).ready_for_source_and_independent_review.map(x => x.file), [note(1).file, note(2).file]));
test('tracked-day accounting uses added rather than later check', () => assert.equal(inventory([], [note(1, 4, '2026-10-01')]).tracked_for_day.length, 0));
test('paused flag is preserved', () => assert.equal(inventory([], [], { ...config, paused: true }).paused, true));
test('invalid report date is rejected', () => assert.throws(() => buildEditorialInventory({ config, day: '2026-02-30' }), /valid UTC date/));
test('older publication with later check determines feed check', () => {
  const r = latestFeedCheck([{ data: { added: '2026-10-14', checked: '2026-10-14' } }, { data: { added: '2026-10-10', checked: '2026-10-15' } }]);
  assert.equal(r.toISOString(), '2026-10-15T00:00:00.000Z');
});
test('feed check is independent of order', () => {
  const a = [{ data: { checked: '2026-10-12' } }, { data: { checked: '2026-10-14' } }];
  assert.equal(latestFeedCheck(a).valueOf(), latestFeedCheck([...a].reverse()).valueOf());
});
test('empty feed invents no date', () => assert.equal(latestFeedCheck([]), null));
test('invalid or missing dates are skipped', () => assert.equal(latestFeedCheck([{}, { data: { checked: 'invalid' } }, { data: { checked: null } }]), null));
test('returned date does not alias input', () => { const original = new Date(day); const result = latestFeedCheck([{ data: { checked: original } }]); result.setUTCFullYear(2000); assert.equal(original.getUTCFullYear(), 2026); });
