import test from 'node:test';
import assert from 'node:assert/strict';
import { feedEntries, entriesOfMonth, newsForCountry } from '../src/data/news.js';
import { gradeNote, parseNote } from '../scripts/news-gate.mjs';

const make = (slug, archived = false) => ({
  slug,
  data: {
    date: new Date('2026-10-02'),
    added: new Date('2026-10-02'),
    checked: new Date('2026-10-06'),
    countries: ['greece'],
    archived,
    score: archived ? 2 : 4,
  },
});

test('истёкшая заметка уходит из свежей ленты и блока страны, но сохраняет адрес и месяц архива', () => {
  const active = make('active');
  const expired = make('expired', true);
  assert.deepEqual(feedEntries([active, expired]).map((e) => e.slug), ['active']);
  assert.deepEqual(newsForCountry([active, expired], 'greece').map((e) => e.slug), ['active']);
  assert.deepEqual(entriesOfMonth([active, expired], '2026-10').map((e) => e.slug).sort(), ['active', 'expired']);
  assert.deepEqual(feedEntries([active, expired], undefined, { includeArchived: true }).map((e) => e.slug).sort(), ['active', 'expired']);
});

test('порог новых новостей остаётся обязательным, архивная правка сохраняет честную оценку', () => {
  assert.equal(gradeNote(make('new-low', false), 3).ok, true);
  assert.equal(gradeNote({ ...make('new-low'), data: { ...make('new-low').data, score: 2 } }, 3).ok, false);
  assert.equal(gradeNote(make('expired', true), 3).ok, false);
  assert.equal(gradeNote(make('expired', true), 3, { previouslyPublished: true }).ok, true);
  assert.equal(gradeNote({ ...make('new-high', true), data: { ...make('new-high', true).data, score: 4 } }, 3).ok, false);
  const parsed = parseNote('---\ntitle: old\ndate: 2026-10-02\nchecked: 2026-10-06\nscore: 2\narchived: true\n---\nOld event.', 'old');
  assert.equal(parsed.data.archived, true);
});
