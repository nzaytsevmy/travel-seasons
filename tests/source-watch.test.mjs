import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fetchSources } from '../scripts/source-watch.mjs';
import { setImmediate as nextTurn } from 'node:timers/promises';

test('занятый сайт не блокирует свободный сетевой слот', async () => {
  const urls = ['https://busy.test/a', 'https://busy.test/b', 'https://busy.test/c', 'https://free.test/a'];
  const sources = new Map(urls.map((url) => [url, new Set(['article'])]));
  const started = [], releases = new Map();
  const pending = fetchSources(sources, { concurrency: 2, perHost: 1, fetcher: (url) => {
    started.push(url);
    return new Promise((resolve) => releases.set(url, resolve));
  } });
  await nextTurn();
  assert.deepEqual(started, [urls[0], urls[3]], 'другой сайт начинается, пока первый занят');
  releases.get(urls[3])({ error: 'timeout' });
  releases.get(urls[0])({ html: 'first' });
  await nextTurn();
  assert.equal(started[2], urls[1]);
  releases.get(urls[1])({ html: 'second' });
  await nextTurn();
  releases.get(urls[2])({ html: 'third' });
  const results = await pending;
  assert.deepEqual(results.map((result) => result.url), urls);
  assert.equal(results[3].error, 'timeout');
});

test('общее число запросов ограничено; хвост очереди не теряется', async () => {
  const urls = Array.from({ length: 17 }, (_, index) => `https://host${index}.test/page`);
  let active = 0, peak = 0;
  const releases = [];
  const pending = fetchSources(new Map(urls.map((url) => [url, new Set()])), { fetcher: (url) => {
    active++; peak = Math.max(peak, active);
    return new Promise((resolve) => releases.push(() => { active--; resolve({ html: url }); }));
  } });
  await nextTurn();
  assert.equal(active, 16);
  assert.equal(releases.length, 16);
  for (const release of releases.splice(0)) release();
  await nextTurn();
  assert.equal(releases.length, 1);
  releases[0]();
  assert.equal((await pending).length, 17);
  assert.equal(peak, 16);
  await assert.rejects(fetchSources(new Map(), { concurrency: 0 }), RangeError);
});

test('обход источников завершает все адреса параллельно и сохраняет недоступный снимок', async () => {
  const fixture = mkdtempSync(join(tmpdir(), 'tt-source-watch-'));
  const pending = [];
  let active = 0, peak = 0, requests = 0;
  const server = createServer((req, res) => {
    active++; requests++; peak = Math.max(peak, active);
    pending.push({ req, res });
    if (pending.length === 2) {
      for (const item of pending.splice(0)) setTimeout(() => {
        active--;
        item.res.writeHead(item.req.url === '/unavailable' ? 503 : 200);
        item.res.end('<html><body>Official travel conditions and entry requirements.</body></html>');
      }, 30);
    }
  });
  let child, timer;
  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const urls = ['/first', '/unavailable', '/third', '/fourth'].map((path) => base + path);
    mkdirSync(join(fixture, 'src/content/blog'), { recursive: true });
    mkdirSync(join(fixture, 'seo-pulse'));
    writeFileSync(join(fixture, 'src/content/blog/test.md'),
      `---\nchecks:\n${urls.map((url) => `  - source: fixture\n    url: "${url}"`).join('\n')}\n---\nfixture\n`);
    const previous = { hash: 'old-verified-hash', size: 123, checked: '2026-10-09' };
    writeFileSync(join(fixture, 'seo-pulse/source-snapshots.json'), JSON.stringify({ [urls[1]]: previous }));
    child = spawn(process.execPath, [resolve('scripts/source-watch.mjs'), '--write'], { cwd: fixture });
    let output = '';
    child.stdout.on('data', (data) => { output += data; });
    child.stderr.on('data', (data) => { output += data; });
    const result = await new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('close', (code, signal) => resolve({ code, signal }));
      timer = setTimeout(() => child.kill('SIGTERM'), 5000);
    });
    assert.equal(result.code, 0, `обход завис на первом сайте: ${JSON.stringify(result)} ${output}`);
    assert.equal(requests, urls.length, 'все источники действительно запрошены');
    assert.equal(peak, 2, 'не больше двух одновременных запросов к одному сайту');
    const snapshots = JSON.parse(readFileSync(join(fixture, 'seo-pulse/source-snapshots.json'), 'utf8'));
    assert.deepEqual(Object.keys(snapshots), urls, 'порядок результата стабилен');
    assert.deepEqual(snapshots[urls[1]], previous, 'ошибка не превращает старый снимок в свежий');
    assert.match(output, /Не открылись 1/);
    for (const url of urls.filter((url) => url !== urls[1])) assert.match(snapshots[url].hash, /^[0-9a-f]{16}$/);
  } finally {
    clearTimeout(timer);
    if (child?.exitCode === null) child.kill('SIGTERM');
    for (const { res } of pending) res.destroy();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    rmSync(fixture, { recursive: true, force: true });
  }
});
