import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { checkArticleCover } from '../scripts/check-article-cover.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const photo = join(root, 'src/content/blog/_images/peru-own/machu2.jpg');
const article = 'src/content/blog/machu-picchu-marshruty-bilety-2026.md';
const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex');
function fixture(quality) {
  const dir = mkdtempSync(join(tmpdir(), 'tt-cover-'));
  mkdirSync(join(dir, 'src/content/blog/_images'), { recursive: true });
  writeFileSync(join(dir, 'src/content/blog/_images/cover.jpg'), readFileSync(photo));
  writeFileSync(join(dir, 'src/content/blog/test.md'), `---\ncoverImage: "./_images/cover.jpg"\n${quality === undefined ? '' : `coverQuality: ${quality}\n`}---\nA useful answer.\n`);
  return dir;
}
test('existing 163 KiB mobile-cover defect is detected before a full build', async () => {
  const dir = fixture();
  try { const result = await checkArticleCover('src/content/blog/test.md', dir); assert.equal(result.ok, false); assert.equal(result.quality, 65); assert.ok(result.bytes > 150 * 1024); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});
test('selected cover passes the unchanged byte limit without changing the photo', async () => {
  const before = hash(photo), result = await checkArticleCover(article, root);
  assert.equal(result.ok, true); assert.ok(result.bytes < 150 * 1024); assert.equal(hash(photo), before);
});
test('unseen previously published cover keeps the default encoding and passes', async () => {
  const filename = readdirSync(join(root, 'src/content/blog')).find(name => /^tutu-vozvrat-bileta-na-poezd-2026\.mdx?$/.test(name));
  assert.ok(filename);
  const result = await checkArticleCover('src/content/blog/' + filename, root);
  assert.equal(result.quality, 65); assert.equal(result.ok, true);
});
test('unsupported quality fails with a useful error', async () => {
  const dir = fixture(49);
  try { await assert.rejects(checkArticleCover('src/content/blog/test.md', dir), /coverQuality/); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});
test('source outside this project is rejected', async () => {
  await assert.rejects(checkArticleCover('../other-project.md', root), /inside this project/);
});
