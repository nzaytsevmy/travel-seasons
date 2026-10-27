import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, statSync, rmSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

test('FlightRoutes changes invalidate only HTML using it, including pages outside sitemap', () => {
  const root = mkdtempSync(join(tmpdir(), 'tt-mtime-components-'));
  // Git hooks export GIT_DIR and other repository-local variables. A fixture
  // must use its own repository even when invoked by the real pre-push hook.
  const fixtureEnv = { ...process.env };
  for (const name of execFileSync('git', ['rev-parse', '--local-env-vars'], { encoding: 'utf8' }).trim().split('\n')) {
    delete fixtureEnv[name];
  }
  const git = (...args) => execFileSync('git', args, { cwd: root, env: fixtureEnv, stdio: 'pipe' });
  const put = (path, body) => {
    mkdirSync(join(root, path, '..'), { recursive: true });
    writeFileSync(join(root, path), body);
  };
  try {
    git('init', '-q');
    git('config', 'user.name', 'Fixture');
    git('config', 'user.email', 'fixture@example.invalid');
    put('src/layouts/Base.astro', 'layout');
    put('src/components/post/FlightRoutes.astro', '<h3>route</h3>');
    put('src/pages/private.astro', 'private');
    git('add', '.');
    execFileSync('git', ['commit', '-qm', 'fixture sources'], {
      cwd: root, env: { ...fixtureEnv, GIT_AUTHOR_DATE: '2026-10-26T16:39:37Z', GIT_COMMITTER_DATE: '2026-10-26T16:39:37Z' },
    });
    put('src/components/post/FlightRoutes.astro', '<h3>new route</h3>');
    git('add', '.');
    execFileSync('git', ['commit', '-qm', 'route change'], {
      cwd: root, env: { ...fixtureEnv, GIT_AUTHOR_DATE: '2026-10-27T16:00:00Z', GIT_COMMITTER_DATE: '2026-10-27T16:00:00Z' },
    });
    const xml = '<urlset><url><loc>https://traveltribe.ru/route/</loc><lastmod>2026-10-01T00:00:00Z</lastmod></url><url><loc>https://traveltribe.ru/other/</loc><lastmod>2026-10-01T00:00:00Z</lastmod></url></urlset>';
    put('dist/sitemap-0.xml', xml);
    put('dist/route/index.html', '<section class="flight-routes"><h3>route</h3></section>');
    put('dist/private/index.html', '<section class="flight-routes"><h3>route</h3></section>');
    put('dist/other/index.html', '<h2>unaffected</h2>');
    copyFileSync(resolve('scripts/set-page-mtimes.mjs'), join(root, 'set-page-mtimes.mjs'));
    const run = () => execFileSync(process.execPath, ['set-page-mtimes.mjs', 'dist'], { cwd: root, env: fixtureEnv, stdio: 'pipe' });
    const seconds = p => Math.floor(statSync(join(root, 'dist', p, 'index.html')).mtimeMs / 1000);
    run();
    assert.equal(seconds('route'), Date.parse('2026-10-27T16:00:00Z') / 1000, 'changed route must invalidate old conditional requests');
    assert.equal(seconds('private'), seconds('route'), 'noindex/out-of-sitemap HTML needs correct validators too');
    assert.equal(seconds('other'), Date.parse('2026-10-26T16:39:37Z') / 1000, 'unrelated page must retain useful 304');
    assert.equal(readFileSync(join(root, 'dist/sitemap-0.xml'), 'utf8'), xml, 'HTTP representation date must not rewrite editorial freshness');
    const before = ['route', 'private', 'other'].map(seconds);
    run();
    assert.deepEqual(['route', 'private', 'other'].map(seconds), before, 'unchanged rebuild must preserve validators');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
