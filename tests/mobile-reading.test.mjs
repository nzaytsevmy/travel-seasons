import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

async function sources(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(async entry => entry.isDirectory()
    ? sources(join(dir, entry.name)) : entry.name.endsWith('.astro') ? [join(dir, entry.name)] : []))).flat();
}

test('every page renders without destination tabs or a fixed affiliate panel', async () => {
  const files = await sources('src');
  assert.ok(files.includes('src/layouts/Layout.astro') && files.includes('src/pages/[slug].astro'), 'layout and generated templates must be scanned');
  const offenders = [];
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    if (/\b(?:DestinationTabs|StickyCta)\b|class=["'][^"']*\bsticky-cta\b/.test(source)) offenders.push(file);
  }
  assert.deepEqual(offenders, [], 'removed navigation and panels must not survive in another template');
});

import { hasReadingObstruction } from '../scripts/mobile-reading-contract.mjs';
test('obstruction scan distinguishes destination navigation from trip data tables', () => {
  assert.equal(hasReadingObstruction('<table class="dt"><tr><td>Перелёт</td></tr></table>'), false);
  assert.equal(hasReadingObstruction('<nav class="dt" aria-label="Разделы направления: Турция">'), true);
  assert.equal(hasReadingObstruction('<div class="sticky-cta"><a>Билеты</a></div>'), true);
});
