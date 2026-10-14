import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { main as runInventory } from '../scripts/news-cap.mjs';
import { gitEnvironment } from '../scripts/release-scope.mjs';
import { recentNews, splitNews, renderNewsSitemap, renderNewsSitemapIndex } from '../src/data/news-discovery.js';
const config = { selectionMode: 'editorial', targetPerDay: null, maxPerDay: null, minScore: 3, paused: false };
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'tt-news-editorial-'));
  mkdirSync(join(root, 'src/content/news'), { recursive: true }); mkdirSync(join(root, 'news'), { recursive: true });
  writeFileSync(join(root, 'news/config.json'), JSON.stringify(config)); execFileSync('git', ['init', '-q'], { cwd: root, env: gitEnvironment() }); return root;
}
const rawNote = score => `---\ntitle: "Test"\nadded: "2026-10-14"\nchecked: "2026-10-14"\n${score == null ? '' : `score: ${score}\n`}---\nText.\n`;
test('actual CLI preserves seven strong, weak and unscored files on repeat', async () => {
  const root = fixture();
  try {
    for (let i = 0; i < 7; i++) writeFileSync(join(root, `src/content/news/story-${i}.md`), rawNote(4));
    writeFileSync(join(root, 'src/content/news/weak.md'), rawNote(2)); writeFileSync(join(root, 'src/content/news/unscored.md'), rawNote(null));
    const first = await runInventory(root);
    assert.equal(first.ready_for_source_and_independent_review.length, 7); assert.equal(first.below_score_floor.length, 1); assert.equal(first.unscored.length, 1);
    execFileSync('git', ['add', 'src/content/news/story-0.md'], { cwd: root, env: gitEnvironment() });
    const second = await runInventory(root); assert.equal(second.candidate_count, 8);
    for (let i = 0; i < 7; i++) assert.equal(readFileSync(join(root, `src/content/news/story-${i}.md`), 'utf8'), rawNote(4));
    assert.equal(second.publication, 'NOT_ATTEMPTED'); assert.equal(readFileSync(join(root, 'news/log.jsonl'), 'utf8').trim().split('\n').length, 2);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
test('actual empty checkout has no quota deficit', async () => {
  const root = fixture(); try { const report = await runInventory(root); assert.equal(report.candidate_count, 0); assert.equal('deficit' in report, false); }
  finally { rmSync(root, { recursive: true, force: true }); }
});
test('inventory respects its checkout when inherited Git hook variables point elsewhere', () => {
  const root = fixture();
  try {
    writeFileSync(join(root, 'src/content/news/own-candidate.md'), rawNote(4));
    const module = new URL('../scripts/news-cap.mjs', import.meta.url).href;
    const script = `import { main } from ${JSON.stringify(module)}; const r=await main(${JSON.stringify(root)}); console.log(JSON.stringify({count:r.candidate_count,tracked:r.tracked_for_day.length}));`;
    const foreignGitDir = execFileSync('git', ['rev-parse', '--absolute-git-dir'], { encoding: 'utf8' }).trim();
    const output = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
      encoding: 'utf8', env: { ...gitEnvironment(), GIT_DIR: foreignGitDir, GIT_WORK_TREE: process.cwd() },
    }).trim().split('\n').at(-1);
    assert.deepEqual(JSON.parse(output), { count: 1, tracked: 0 });
    assert.ok(existsSync(join(root, 'src/content/news/own-candidate.md')));
  } finally { rmSync(root, { recursive: true, force: true }); }
});
test('a symlink candidate is rejected without touching its target', async () => {
  const root = fixture(); try {
    writeFileSync(join(root, 'outside.md'), rawNote(4)); symlinkSync(join(root, 'outside.md'), join(root, 'src/content/news/link.md'));
    await assert.rejects(() => runInventory(root), /Invalid news file/); assert.ok(existsSync(join(root, 'outside.md')));
  } finally { rmSync(root, { recursive: true, force: true }); }
});
const e = (slug, added, extra = {}) => ({ slug, data: { title: 'A & B <C>', added, checked: '2026-10-14', ...extra } });
const now = new Date('2026-10-14T12:00:00Z');
test('only first publications in the last 48 hours enter news sitemaps', () => {
  const records = recentNews([e('fresh', '2026-10-14'), e('near', '2026-10-12T12:00:01Z'), e('boundary', '2026-10-12T12:00:00Z'), e('rechecked', '2026-10-01'), e('future', '2026-10-15'), e('archived', '2026-10-14', { archived: true }), e('missing', undefined), e('invalid', 'bad')], now);
  assert.deepEqual(records.map(x => x.slug), ['fresh', 'near']);
});
test('rechecking an old publication does not make it new', () => assert.equal(recentNews([e('old', '2026-09-01', { checked: now })], now).length, 0));
test('XML text and publication date are accurate and escaped', () => {
  const xml = renderNewsSitemap(recentNews([e('fresh', '2026-10-13')], now));
  assert.match(xml, /A &amp; B &lt;C&gt;/); assert.match(xml, /2026-10-13T00:00:00.000Z/);
  assert.doesNotMatch(xml, /lastmod|2026-10-14/); assert.match(xml, /<news:language>ru<\/news:language>/);
});
test('more than 1000 news entries are sharded, not dropped', () => {
  const records = recentNews(Array.from({ length: 1001 }, (_, i) => e(`fresh-${i}`, '2026-10-14')), now);
  const pages = splitNews(records); assert.deepEqual(pages.map(x => x.length), [1000, 1]);
  assert.throws(() => renderNewsSitemap(records), /1000/); assert.match(renderNewsSitemapIndex(pages), /sitemap-news\/2\.xml/);
  assert.equal((renderNewsSitemap(pages[0]).match(/<url>/g) ?? []).length, 1000);
});
test('an empty sitemap does not substitute old articles', () => {
  const xml = renderNewsSitemap([]); assert.match(xml, /<urlset[\s\S]*<\/urlset>/); assert.doesNotMatch(xml, /<url>/);
});
test('unsafe or duplicate URLs stop sitemap generation', () => {
  assert.throws(() => recentNews([e('../outside', '2026-10-14')], now), /Invalid/);
  assert.throws(() => recentNews([e('same', '2026-10-14'), e('same', '2026-10-14')], now), /Duplicate/);
});
