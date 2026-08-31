import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const GLOBAL_SHELL_INPUTS = [
  'astro.config.mjs',
  'src/layouts',
  'src/components/SwissHeader.astro',
  'src/components/CookieConsent.astro',
  'src/styles/global.css',
  'src/scripts/monetization-tracking.js',
  'src/data/monetization.js',
  'src/data/affiliate.js',
];

const repoRoot = fileURLToPath(new URL('../', import.meta.url));

function latestGitDate(paths) {
  return new Date(execFileSync(
    'git',
    ['log', '-1', '--format=%cI', '--', ...paths],
    { cwd: repoRoot, encoding: 'utf8' },
  ).trim());
}

test('global shell changes advance every generated page mtime', (t) => {
  const dist = mkdtempSync(join(tmpdir(), 'tt-page-mtime-'));
  t.after(() => rmSync(dist, { recursive: true, force: true }));
  const pageDir = join(dist, 'blog', 'cache-probe');
  mkdirSync(pageDir, { recursive: true });
  writeFileSync(join(pageDir, 'index.html'), '<!doctype html><title>probe</title>');
  writeFileSync(join(dist, 'sitemap-0.xml'), [
    '<urlset>',
    '<url><loc>https://traveltribe.ru/blog/cache-probe/</loc><lastmod>2020-01-01</lastmod></url>',
    '</urlset>',
  ].join(''));

  execFileSync('node', ['scripts/set-page-mtimes.mjs', dist], { cwd: repoRoot });

  const actual = statSync(join(pageDir, 'index.html')).mtimeMs;
  const expected = latestGitDate(GLOBAL_SHELL_INPUTS).getTime();
  assert.equal(actual, expected);
});

test('a page date newer than the global shell is preserved', (t) => {
  const dist = mkdtempSync(join(tmpdir(), 'tt-page-mtime-'));
  t.after(() => rmSync(dist, { recursive: true, force: true }));
  const pageDir = join(dist, 'blog', 'future-probe');
  mkdirSync(pageDir, { recursive: true });
  writeFileSync(join(pageDir, 'index.html'), '<!doctype html><title>future probe</title>');
  writeFileSync(join(dist, 'sitemap-0.xml'), [
    '<urlset>',
    '<url><loc>https://traveltribe.ru/blog/future-probe/</loc><lastmod>2099-01-01</lastmod></url>',
    '</urlset>',
  ].join(''));

  execFileSync('node', ['scripts/set-page-mtimes.mjs', dist], { cwd: repoRoot });

  assert.equal(
    statSync(join(pageDir, 'index.html')).mtime.toISOString(),
    '2099-01-01T00:00:00.000Z',
  );
});
