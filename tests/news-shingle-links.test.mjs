import test from 'node:test';
import assert from 'node:assert/strict';
import { checkShingles } from '../scripts/news-gate.mjs';

const headline = 'sexy mantis obscene orangutan and prancing sparrowhawk feature';
const sourceUrl = 'https://www.livescience.com/animals/sexy-mantis-obscene-orangutan-and-prancing-sparrowhawk-feature-in-2026-nikon-comedy-wildlife-awards';

test('a source URL slug is not copied article prose', () => {
  const note = { body: `Посмотрите [фотографии финалистов](${sourceUrl}) и пояснения авторов к ним.` };
  assert.equal(checkShingles(note, [headline]).ok, true);
});

test('copied words in a visible link label remain blocked', () => {
  const note = { body: `[${headline}](${sourceUrl})` };
  assert.equal(checkShingles(note, [headline]).ok, false);
});

test('copied prose remains blocked beside an ordinary source link', () => {
  const note = { body: `${headline}. [Источник](${sourceUrl}).` };
  assert.equal(checkShingles(note, [headline]).ok, false);
});
