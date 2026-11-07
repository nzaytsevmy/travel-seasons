import test from 'node:test';
import assert from 'node:assert/strict';
import { getEntryRequirements, visaCatalogFact } from '../src/data/entry-requirements.js';

test('domestic travel never takes its mode or fields from the foreign visa type', () => {
  const entry = getEntryRequirements({ slug: 'dagestan', domestic: true, visa: 'free' }, '2026-11-06');
  assert.equal(entry.mode, 'domestic');
  assert.match(entry.documents, /внутренний паспорт РФ/);
  assert.equal(entry.stay, null);
  assert.equal(entry.fee, null);
});

test('a confirmed mode does not fill in missing or expired facts', () => {
  const egypt = { slug: 'egypt', visa: 'evisa' };
  const fresh = getEntryRequirements(egypt, '2026-11-06');
  assert.equal(fresh.mode, 'evisa');
  assert.equal(fresh.stay, null); // this fixture predates the 7 November stay check
  assert.match(fresh.documents, /распечатанную визу/);
  const expired = getEntryRequirements(egypt, '2026-12-06');
  assert.equal(expired.mode, 'unknown');
  assert.equal(expired.documents, null);
  assert.equal(expired.fee, null);
  assert.equal(expired.official, fresh.official);
  assert.equal(getEntryRequirements({ slug: 'not-a-country', visa: 'free' }, '2026-11-06').mode, 'unknown');
});

test('catalogue answers share the checked facts and stop showing them at review time', () => {
  assert.match(visaCatalogFact('schengen', '2026-11-06'), /полностью входят в Шенген/);
  assert.match(visaCatalogFact('japan', '2026-11-06'), /в Визовом центре Японии/);
  assert.equal(visaCatalogFact('japan', '2026-12-06'), null);
});
