import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { googlebotAllowed } from '../scripts/lib/search-indexability.mjs';
import { checkPageStructure } from '../scripts/structural-checks.mjs';

const origin = 'https://traveltribe.ru';
const audit = fileURLToPath(new URL('../scripts/seo-site-audit.mjs', import.meta.url));
const page = (canonical = origin + '/', meta = '') => `<html><head>
<title>Маршрут по Данангу и Золотому мосту</title>
<meta name="description" content="Как самостоятельно приехать в горный парк из Дананга. Билеты на канатную дорогу, расписание автобуса и маршрут на один день.">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="Путеводитель">
<meta property="og:description" content="Описание">
<meta property="og:image" content="${origin}/ok.jpg">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary_large_image">
${meta}</head><body><main><h1>Путеводитель</h1></main></body></html>`;

test('site audit rejects broken indexing signals and accepts a valid legacy alias', t => {
  const dir = mkdtempSync(join(tmpdir(), 'traveltribe-search-'));
  t.after(() => rmSync(dir, { recursive: true }));
  const write = (name, text) => writeFileSync(join(dir, name), text);
  const index = extra => write('sitemap-index.xml', `<sitemapindex><sitemap><loc>${origin}/sitemap-0.xml</loc></sitemap>${extra}</sitemapindex>`);
  const run = expected => {
    const result = spawnSync(process.execPath, [audit, dir], { encoding: 'utf8', timeout: 10000 });
    assert.ifError(result.error);
    assert.equal(result.status, expected ? 1 : 0, result.stdout + result.stderr);
    if (expected) assert.match(result.stdout, expected);
  };

  index('');
  write('sitemap-0.xml', `<urlset><url><loc>${origin}/</loc></url></urlset>`);
  write('index.html', page());
  mkdirSync(join(dir, 'legacy'));
  write('legacy/index.html', page());
  run();
  index(`<sitemap><loc>${origin}/missing.xml</loc></sitemap>`);
  run(/sitemap\.missing_child/);
  index('');
  write('robots.txt', 'User-agent: *\nDisallow: /');
  run(/sitemap\.robots_blocked/);
  write('robots.txt', 'User-agent: *\nAllow: /');
  write('index.html', page(undefined, '<meta name="googlebot" content="noindex">'));
  run(/sitemap\.noindex_url/);
  write('index.html', page(undefined, '<meta name="robots" content="index"><meta name="robots" content="none">'));
  run(/sitemap\.noindex_url/);
  write('index.html', page());
  write('legacy/index.html', page(origin + '/missing/'));
  run(/canonical\.invalid_target/);

  const closedTrip = '/trips/january/kamchatka/';
  mkdirSync(join(dir, closedTrip), { recursive: true });
  write(closedTrip + 'index.html', page(origin + closedTrip, '<meta name="robots" content="noindex">'));
  write('legacy/index.html', page(origin + closedTrip));
  run(/canonical\.invalid_target/);
  write('legacy/index.html', page());
  mkdirSync(join(dir, 'seasons/kamchatka/january'), { recursive: true });
  write('seasons/kamchatka/january/index.html', page(origin + closedTrip));
  run();
});

test('Googlebot rules honor group specificity, escaping and Allow precedence', () => {
  const allowed = googlebotAllowed(`User-agent: *
Disallow: /
User-agent: Googlebot
Disallow: /архив/*
Allow: /архив/открыто/$
Disallow: /same/
Allow: /same/
User-agent: Googlebot
Disallow: /extra/
`);
  assert.equal(allowed(origin + '/'), true);
  assert.equal(allowed(origin + '/архив/закрыто/'), false);
  assert.equal(allowed(origin + '/архив/открыто/'), true);
  assert.equal(allowed(origin + '/архив/открыто/?x=1'), false);
  assert.equal(allowed(origin + '/same/'), true);
  assert.equal(allowed(origin + '/extra/'), false);
});

test('live entry point rejects unexpected noindex and non-HTML responses', async () => {
  const response = (headers, status = 200) => ({
    status: () => status,
    headersArray: async () => headers.map(([name, value]) => ({ name, value })),
  });
  const check = (headers, status) => checkPageStructure({
    setViewportSize: async () => {},
    goto: async () => response(headers, status),
    locator: () => ({ evaluateAll: async () => ['index, follow'] }),
  }, origin + '/', 402, { live: true });

  assert.deepEqual(await check([
    ['Content-Type', 'text/html; charset=utf-8'],
    ['X-Robots-Tag', 'otherbot: noindex'],
    ['X-Robots-Tag', 'googlebot: nofollow, none'],
  ]), ['Unexpected X-Robots-Tag noindex for Googlebot']);
  assert.deepEqual(await check([
    ['Content-Type', 'application/json'],
    ['X-Robots-Tag', 'googlebot-news: noindex'],
  ], 206), ['Expected HTTP 200, got 206', 'Expected HTML, got application/json']);
});
