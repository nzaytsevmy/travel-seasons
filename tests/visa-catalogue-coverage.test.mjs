import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DIRECTIONS } from '../src/data/directions.js';
import { getEntryRequirements } from '../src/data/entry-requirements.js';

test('every existing country record reaches the catalogue instead of an unknown placeholder', () => {
  const missing = DIRECTIONS.filter((d) => getEntryRequirements(d, '2026-11-07').mode === 'unknown');
  assert.deepEqual(missing.map((d) => d.slug), []);
});

test('restored guides do not invent generic facts or bypass expired verified records', () => {
  const mexico = getEntryRequirements({ slug: 'mexico', visa: 'free' }, '2026-11-07');
  assert.equal(mexico.mode, 'evisa');
  assert.equal(mexico.legacy, true);
  assert.equal(mexico.feeUsd, null);
  assert.equal(getEntryRequirements({ slug: 'mexico', visa: 'free' }, '2026-12-06').mode, 'unknown');
  assert.equal(getEntryRequirements({ slug: 'egypt', visa: 'evisa' }, '2026-12-06').stay, null);
  assert.equal(getEntryRequirements({ slug: 'invented-country', visa: 'free' }, '2026-11-07').fee, null);
  for (const slug of ['uzbekistan', 'tajikistan', 'kazakhstan', 'kyrgyzstan']) {
    assert.equal(getEntryRequirements({ slug, visa: 'free' }, '2026-11-07').stay, null);
  }
});

test('Egypt answers the stay and Sinai exception; Japan gives the actual application checklist', () => {
  const egypt = getEntryRequirements({ slug: 'egypt', visa: 'evisa' }, '2026-11-07');
  assert.match(egypt.stay ?? '', /30/);
  assert.match(egypt.exception, /15/);
  assert.doesNotMatch(egypt.exception, /уточни/iu);
  const japan = getEntryRequirements({ slug: 'japan', visa: 'required' }, '2026-11-07');
  for (const item of [/два экземпляра/iu, /35\s*[×x]\s*45/, /внутреннего паспорта/iu, /выписк/iu, /программ/iu]) {
    assert.match(japan.documents, item);
  }
});

test('the catalogue has no decorative figures and no placeholder category', () => {
  const source = readFileSync(new URL('../src/pages/visa/index.astro', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /<[^>]+class="(?:va-section-count|va-card-num|va-related-num|va-chip-n)"/);
  assert.doesNotMatch(source, /Уточнить правила|Билеты по 77 направлениям реестра/);
});
