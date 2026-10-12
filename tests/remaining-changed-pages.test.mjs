import { test } from 'node:test';
import assert from 'node:assert/strict';
import { remainingStructuralBatches } from '../scripts/check-remaining-changed-pages.mjs';
import { MAX_PAGES } from '../scripts/structural-checks.mjs';

test('a daily batch beyond the first twelve does not silently lose changed pages', () => {
  const files = Array.from({ length: 29 }, (_, i) => `src/content/news/2026-10-12-item-${i}.md`);
  files.splice(3, 0, 'src/content/news/_images/example.jpg', 'reviews/blog/example.json');
  const batches = remainingStructuralBatches(files.join('\n'));
  assert.ok(batches.every((batch) => batch.length <= MAX_PAGES));
  assert.deepEqual(batches.map((batch) => batch.length), [12, 5]);
  assert.deepEqual(batches.flat(), Array.from({ length: 17 }, (_, i) => `/novosti/2026-10-12-item-${i + 12}/`));
});
test('the existing full run still handles a small batch without another browser', () => {
  assert.deepEqual(remainingStructuralBatches('src/content/blog/doha.mdx'), []);
});
test('an unmapped changed article is an error rather than an empty green run', () => {
  assert.throws(() => remainingStructuralBatches('src/content/blog/INVALID.mdx'), /Unmapped/);
});
