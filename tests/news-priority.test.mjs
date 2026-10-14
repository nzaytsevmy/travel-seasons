import test from 'node:test';
import assert from 'node:assert/strict';
import * as news from '../src/data/news.js';
import { buildEditorialInventory } from '../scripts/news-cap.mjs';

const now = new Date('2026-10-14T12:00:00Z');
const { feedEntries, frontPageEntries, relatedNews } = news;
const entry = (slug, added, extra = {}) => ({ slug, data: {
  added: new Date(added), checked: new Date(added), date: new Date(added),
  topic: 'nature', countries: ['japan'], impact: 'medium', score: 3, ...extra,
} });

test('a timely important story precedes a newer routine story on the front page', () => {
  const ordinary = entry('ordinary', '2026-10-14');
  const important = entry('important', '2026-10-13', { score: 5, impact: 'high' });
  assert.deepEqual(frontPageEntries([ordinary, important], 24, now).map(e => e.slug), ['important', 'ordinary']);
  assert.deepEqual(feedEntries([ordinary, important]).map(e => e.slug), ['ordinary', 'important']);
});
test('old high scores do not permanently pin stories and the page stays bounded', () => {
  const old = entry('old', '2026-09-01', { score: 5, impact: 'high' });
  const fresh = Array.from({ length: 30 }, (_, i) => entry(`fresh-${i}`, '2026-10-14'));
  const result = frontPageEntries([old, ...fresh], 24, now);
  assert.equal(result.length, 24); assert.ok(!result.some(e => e.slug === 'old'));
  assert.equal(new Set(result.map(e => e.slug)).size, 24);
});
test('archived and future publications are not promoted', () => {
  const result = frontPageEntries([
    entry('current', '2026-10-14'), entry('future', '2026-10-15', { score: 5 }),
    entry('archived', '2026-10-14', { score: 5, archived: true }),
  ], 24, now);
  assert.deepEqual(result.map(e => e.slug), ['current']);
});
test('related reading prefers the same country and question over chronological neighbours', () => {
  const current = entry('current', '2026-10-14', { topic: 'visa' });
  const unrelated = entry('unrelated', '2026-10-14', { countries: ['egypt'] });
  const country = entry('country', '2026-10-13');
  const sameQuestion = entry('same-question', '2026-10-12', { topic: 'visa' });
  assert.deepEqual(relatedNews([current, unrelated, country, sameQuestion], current, 3, now).map(e => e.slug), ['same-question', 'country']);
});
test('unrelated, archived and self links do not masquerade as related reading', () => {
  const current = entry('current', '2026-10-14');
  assert.deepEqual(relatedNews([current,
    entry('other-country', '2026-10-13', { countries: ['thailand'] }),
    entry('archived', '2026-10-13', { archived: true }),
  ], current, 3, now), []);
});
test('inventory counts a late UTC publication on its actual Moscow publication day', () => {
  const config = { selectionMode: 'editorial', targetPerDay: null, maxPerDay: null, minScore: 3 };
  const result = buildEditorialInventory({ config, candidates: [], day: '2026-10-15',
    tracked: [{ file: 'src/content/news/evening.md', note: { data: { score: 4, added: '2026-10-14T22:30:00Z' } } }],
  });
  assert.equal(result.tracked_for_day.length, 1);
  assert.equal(result.timezone, 'Europe/Moscow');
});
