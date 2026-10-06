import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { classifyNewsPush } from '../scripts/news-push-scope.mjs';
import { parseCommittedNewsPaths } from '../scripts/news-gate.mjs';

const modified = path => ({ path, status: 'M', oldMode: '100644', newMode: '100644' });
const added = path => ({ path, status: 'A', oldMode: '000000', newMode: '100644' });

test('pure news push checks every committed note and accepts its editorial artifacts', () => {
  const result = classifyNewsPush([
    added('src/content/news/2026-10-06-new-note.md'),
    modified('src/content/news/2026-10-02-old-note.md'),
    added('src/content/news/_images/2026-10-06-new-note.jpg'),
    added('news/reviews/2026-10-06-new-note.json'),
    added('news/snapshots/abc123.json'),
    modified('news/log.jsonl'),
  ]);
  assert.deepEqual(result, {
    mode: 'news',
    paths: [
      'src/content/news/2026-10-02-old-note.md',
      'src/content/news/2026-10-06-new-note.md',
    ],
  });
});

test('code, gate configuration, deletions, mode changes and image-only pushes stay full', () => {
  const note = modified('src/content/news/2026-10-06-new-note.md');
  const unsafe = [
    modified('scripts/news-gate.mjs'),
    modified('src/content/config.ts'),
    modified('news/config.json'),
    { ...note, status: 'D', newMode: '000000' },
    { ...note, newMode: '100755' },
  ];
  for (const change of unsafe) {
    assert.equal(classifyNewsPush([note, change]).mode, 'full', change.path);
  }
  assert.equal(classifyNewsPush([added('src/content/news/_images/photo.jpg')]).mode, 'full');
  assert.equal(classifyNewsPush([]).mode, 'full');
});

test('committed path input rejects an empty or unrelated list and deduplicates notes', () => {
  const path = 'src/content/news/2026-10-06-new-note.md';
  assert.deepEqual(parseCommittedNewsPaths(`${path}\n${path}\n`), ['2026-10-06-new-note.md']);
  assert.throws(() => parseCommittedNewsPaths('\n'), /пути|пуст/i);
  assert.throws(() => parseCommittedNewsPaths('src/content/blog/foo.md\n'), /путь|news/i);
  assert.throws(() => parseCommittedNewsPaths('src/content/news/../config.ts\n'), /путь|news/i);
});

test('pre-push runs the committed news gate before the build', () => {
  const hook = readFileSync(new URL('../scripts/pre-push.sh', import.meta.url), 'utf8');
  const scope = hook.indexOf('news-push-scope.mjs');
  const gate = hook.indexOf('news-gate.mjs --paths-stdin');
  const build = hook.indexOf('SKIP_HTML_MIN=1 npm run build');
  assert.ok(scope > 0 && gate > scope && build > gate);
  assert.match(hook.slice(gate, build), /news-lifecycle\.mjs/);
  assert.match(hook.slice(scope, gate), /git status --porcelain -- src\/content\/news news/);
});

test('CLI reads a real committed Git diff and rejects a later configuration change', () => {
  const repo = mkdtempSync(join(tmpdir(), 'tt-news-scope-'));
  const script = new URL('../scripts/news-push-scope.mjs', import.meta.url).pathname;
  const git = (...args) => {
    const run = spawnSync('git', args, { cwd: repo, encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    return run.stdout.trim();
  };
  const commit = message => {
    git('add', '.');
    git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', message);
  };
  try {
    git('init', '-q');
    writeFileSync(join(repo, 'README.md'), 'base\n');
    commit('base');
    const base = git('rev-parse', 'HEAD');
    mkdirSync(join(repo, 'src/content/news'), { recursive: true });
    writeFileSync(join(repo, 'src/content/news/2026-10-06-new-note.md'), 'note\n');
    commit('news');
    const run = () => spawnSync(process.execPath,
      [script, '--base', base, '--head', 'HEAD', '--paths-only'], { cwd: repo, encoding: 'utf8' });
    const news = run();
    assert.equal(news.status, 0, news.stderr);
    assert.equal(news.stdout.trim(), 'src/content/news/2026-10-06-new-note.md');
    mkdirSync(join(repo, 'news'), { recursive: true });
    writeFileSync(join(repo, 'news/config.json'), '{}\n');
    commit('config');
    assert.equal(run().status, 2);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
