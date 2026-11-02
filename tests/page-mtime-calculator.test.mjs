import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, statSync, rmSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

test('калькулятор сообщает об изменении своей страницы и курса, не обновляя соседние страницы', () => {
  const root = mkdtempSync(join(tmpdir(), 'tt-mtime-calculator-'));
  const env = { ...process.env };
  for (const name of execFileSync('git', ['rev-parse', '--local-env-vars'], { encoding: 'utf8' }).trim().split('\n')) delete env[name];
  const git = (...args) => execFileSync('git', args, { cwd: root, env, stdio: 'pipe' });
  const put = (path, body) => {
    mkdirSync(join(root, path, '..'), { recursive: true });
    writeFileSync(join(root, path), body);
  };
  const commit = (message, date) => execFileSync('git', ['commit', '-qm', message], {
    cwd: root, env: { ...env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date },
  });
  try {
    git('init', '-q');
    git('config', 'user.name', 'Fixture');
    git('config', 'user.email', 'fixture@example.invalid');
    put('src/layouts/Base.astro', 'layout');
    put('src/pages/calculator.astro', 'old calculator');
    git('add', '.');
    commit('initial', '2026-10-26T16:39:37Z');
    put('src/pages/calculator.astro', 'updated calculator');
    git('add', '.');
    commit('calculator update', '2026-10-27T16:00:00Z');
    put('dist/sitemap-0.xml', '<urlset><url><loc>https://traveltribe.ru/calculator/</loc><lastmod>2026-10-01T00:00:00Z</lastmod></url><url><loc>https://traveltribe.ru/other/</loc><lastmod>2026-10-01T00:00:00Z</lastmod></url></urlset>');
    put('dist/sitemap-index.xml', '<sitemapindex><sitemap><loc>https://traveltribe.ru/sitemap-0.xml</loc><lastmod>2026-10-01T00:00:00Z</lastmod></sitemap></sitemapindex>');
    put('dist/calculator/index.html', '<time data-budget-rate-date="2026-10-01">курс</time>');
    put('dist/other/index.html', '<h1>other</h1>');
    copyFileSync(resolve('scripts/set-page-mtimes.mjs'), join(root, 'set-page-mtimes.mjs'));
    copyFileSync(resolve('scripts/calculator-freshness.mjs'), join(root, 'calculator-freshness.mjs'));
    const run = () => execFileSync(process.execPath, ['set-page-mtimes.mjs', 'dist'], { cwd: root, env, stdio: 'pipe' });
    const seconds = path => Math.floor(statSync(join(root, 'dist', path, 'index.html')).mtimeMs / 1000);
    run();
    assert.equal(seconds('calculator'), Date.parse('2026-10-27T16:00:00Z') / 1000);
    assert.equal(seconds('other'), Date.parse('2026-10-26T16:39:37Z') / 1000);
    assert.match(readFileSync(join(root, 'dist/sitemap-0.xml'), 'utf8'), /calculator\/<\/loc><lastmod>2026-10-27T16:00:00\.000Z/);
    assert.match(readFileSync(join(root, 'dist/sitemap-index.xml'), 'utf8'), /<lastmod>2026-10-27T16:00:00\.000Z/);

    put('dist/calculator/index.html', '<time data-budget-rate-date="2026-11-01">курс</time>');
    run();
    assert.equal(seconds('calculator'), Date.parse('2026-11-01T00:00:00Z') / 1000);
    assert.equal(seconds('other'), Date.parse('2026-10-26T16:39:37Z') / 1000);
    assert.match(readFileSync(join(root, 'dist/sitemap-index.xml'), 'utf8'), /<lastmod>2026-11-01T00:00:00\.000Z/);
    run();
    assert.equal(seconds('calculator'), Date.parse('2026-11-01T00:00:00Z') / 1000, 'та же сборка не меняет дату повторно');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
