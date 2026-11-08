import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { buildEditorialInventory, validateEditorialConfig } from '../scripts/news-cap.mjs';
import { latestFeedCheck, latestFeedModified, feedModifiedMoscowDay, checkedCalendarDay } from '../src/data/news-discovery.js';
import { newsFrontmatter } from '../src/data/news-frontmatter.js';
const config = { selectionMode: 'editorial', targetPerDay: null, maxPerDay: null, minScore: 3, paused: false };
const day = '2026-10-14';
const note = (i, score = 4, added = day) => ({ file: `src/content/news/story-${String(i).padStart(2, '0')}.md`, note: { data: { score, added, checked: day, topic: 'nature' } } });
const inventory = (candidates = [], tracked = [], cfg = config) => buildEditorialInventory({ config: cfg, candidates, tracked, day });
test('important access change ranks first, then verified attention, without discarding other candidates', () => {
  const urgent = note(1, 3); urgent.note.data.impact = 'high';
  const rising = note(2, 4); rising.note.data.attentionQuery = 'Шереметьево';
  const ordinary = note(3, 5); ordinary.note.data.attentionQuery = 'Альдабра';
  const now = new Date('2026-10-14T11:00:00Z');
  const attention = { status: 'ok', region: 'RU', observedAt: now.toISOString(), items: [
    { query: 'Шереметьево', startedAt: '2026-10-14T09:50:00Z', reportedTraffic: '1000+' },
  ] };
  const r = buildEditorialInventory({ config, day, now, attention, candidates: [ordinary, rising, urgent] });
  assert.deepEqual(r.ready_for_source_and_independent_review.map(x => x.file), [urgent.file, rising.file, ordinary.file]);
  assert.equal(r.ready_for_source_and_independent_review[1].searchSurge[0].reportedTraffic, '1000+');
  assert.deepEqual(r.deleted_files, []);
  assert.equal(r.attention_status, 'fresh_ru');
  const stale = buildEditorialInventory({ config, day, now, attention: { ...attention, observedAt: '2026-10-01' }, candidates: [ordinary, rising] });
  assert.equal(stale.attention_status, 'unavailable_or_stale');
  assert.deepEqual(stale.ready_for_source_and_independent_review.map(x => x.file), [ordinary.file, rising.file]);
});
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
test('invalid report date is rejected', () => assert.throws(() => buildEditorialInventory({ config, day: '2026-02-30' }), /valid Moscow date/));
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
test('a real editorial change to the feed is reflected even when its stories were checked earlier', () => {
  const date = latestFeedModified([{ data: { checked: '2026-11-08' } }], '2026-11-08T21:30:00Z');
  assert.equal(date.toISOString(), '2026-11-08T21:00:00.000Z');
  assert.equal(feedModifiedMoscowDay(date), '2026-11-09');
});
test('a later checked story can move the feed date, and rebuilding unchanged input cannot', () => {
  const entries = [{ data: { checked: '2026-11-10' } }];
  const first = latestFeedModified(entries, '2026-11-11T12:00:00Z');
  assert.equal(first.toISOString(), '2026-11-09T21:00:00.000Z');
  assert.equal(latestFeedModified(entries, '2026-11-12T12:00:00Z').toISOString(), first.toISOString());
});
test('a feed editorial date in the future is rejected', () => {
  assert.throws(() => latestFeedModified([], '2026-11-08T20:59:59Z'), /future/i);
  assert.throws(() => latestFeedModified([{ data: { checked: '2026-11-10' } }], '2026-11-09T12:00:00Z'), /future/i);
  assert.throws(() => latestFeedModified([{ data: { checked: '2026-11-09T02:00:00Z' } }], '2026-11-08T22:00:00Z'), /calendar day/i);
  assert.throws(() => checkedCalendarDay('2026-11-09T00:00:00.000Z'), /calendar day/i);
});
test('a same-day Moscow check is not future between midnight Moscow and midnight UTC', () => {
  const date = latestFeedModified([{ data: { checked: '2026-11-09' } }], '2026-11-08T22:00:00Z');
  assert.equal(date.toISOString(), '2026-11-08T21:00:00.000Z');
  assert.equal(feedModifiedMoscowDay(date), '2026-11-09');
  assert.equal(latestFeedModified([{ data: { checked: new Date('2026-11-09T00:00:00Z') } }], '2026-11-09T00:10:00Z').toISOString(), date.toISOString());
});
test('news source checked values are valid calendar days before Astro coerces them', () => {
  const directory = new URL('../src/content/news/', import.meta.url);
  const files = readdirSync(directory).filter(name => /\.mdx?$/.test(name));
  assert(files.length > 0);
  for (const file of files) {
    const checked = newsFrontmatter(readFileSync(new URL(file, directory), 'utf8')).checked;
    assert.equal(typeof checked, 'string', file);
    assert.equal(checkedCalendarDay(checked), checked, file);
  }
  assert.throws(() => checkedCalendarDay('2026-02-29'), /Invalid/i);
  assert.throws(() => checkedCalendarDay('2026-11-09T00:00:00Z'), /calendar day/i);
});
