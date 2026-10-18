import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const program = [
  'import sys,json',
  'sys.path.insert(0,".github/scripts")',
  'import seo_ping,max_post',
  'files=seo_ping.changed_files()',
  'print(json.dumps({"files":files,"news":max_post.new_news_files()}))',
].join('\n');

function run(env) {
  return spawnSync('python3', ['-c', program], {
    cwd: root, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, CHANGED_FILES: '', CHANGED_FILES_FILE: '', MAX_DRY_RUN: '1', ...env },
  });
}

function withFile(files, check) {
  const directory = mkdtempSync(join(tmpdir(), 'tt-changed-files-'));
  try {
    const path = join(directory, 'changed-files.nul');
    writeFileSync(path, files.join('\0') + '\0');
    check(path);
  } finally { rmSync(directory, { recursive: true, force: true }); }
}

// Native deploy 39111827959 could not spawn bash: its 2,611-path environment
// value exceeded Linux's per-string limit. A short file pointer must retain
// the complete batch for both post-deploy consumers without a huge variable.
test('bulk changes reach SEO and news readers through a small file pointer', () => {
  const news = 'src/content/news/changed-file-input-fixture.md';
  const files = Array.from({ length: 2610 }, (_, i) =>
    'src/assets/hotels/costa-rica-panama/long-property-name-' + i + '-editorial-3.webp');
  files.push(news);
  assert.ok(Buffer.byteLength(files.join('\n')) > 128 * 1024);
  withFile(files, path => {
    const result = run({ CHANGED_FILES_FILE: path, CHANGED_FILES: 'src/pages/legacy-placeholder.astro' });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0, result.stderr);
    const value = JSON.parse(result.stdout);
    assert.equal(value.files.length, files.length);
    assert.deepEqual(value.files, files);
    assert.deepEqual(value.news, [news]);
  });
});

test('NUL input preserves whitespace, non-ASCII and embedded newlines in Git paths', () => {
  const files = ['src/assets/hotels/тест с пробелом.webp', 'src/assets/hotels/line\nbreak.webp'];
  withFile(files, path => {
    const result = run({ CHANGED_FILES_FILE: path });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout).files, files);
  });
});

test('existing newline-separated environment input remains compatible', () => {
  const result = run({ CHANGED_FILES: ' src/pages/japan.astro \n\nsrc/pages/oman.astro\n' });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout).files, ['src/pages/japan.astro', 'src/pages/oman.astro']);
});

test('a missing declared input file fails rather than silently dropping changes', () => {
  const directory = mkdtempSync(join(tmpdir(), 'tt-changed-files-missing-'));
  try {
    const result = run({ CHANGED_FILES_FILE: join(directory, 'missing.nul') });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /FileNotFoundError/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
