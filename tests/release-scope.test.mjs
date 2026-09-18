import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { classifyRelease, gitChanges } from '../scripts/release-scope.mjs';

const queue = { path: 'DAILY-ARTICLE-QUEUE.md', status: 'M', oldMode: '100644', newMode: '100644' };
test('only a regular-file edit of the editorial queue uses accounting checks', () => {
  assert.equal(classifyRelease([queue]), 'accounting');
  for (const path of ['README.md', 'CLAUDE.md', 'src/content/blog/guide.mdx', 'news/config.json',
    '.github/workflows/build.yml', 'scripts/pre-push.sh', 'public/queue.md']) {
    assert.equal(classifyRelease([{ ...queue, path }]), 'full', path);
    assert.equal(classifyRelease([queue, { ...queue, path }]), 'full', `mixed: ${path}`);
  }
});
test('empty, renamed, deleted, added and symlink changes never use the shortcut', () => {
  assert.equal(classifyRelease([]), 'full');
  for (const status of ['A', 'D', 'R100', 'T', 'M\n'])
    assert.equal(classifyRelease([{ ...queue, status }]), 'full');
  for (const mode of ['120000', '100755', '000000']) {
    assert.equal(classifyRelease([{ ...queue, oldMode: mode }]), 'full');
    assert.equal(classifyRelease([{ ...queue, newMode: mode }]), 'full');
  }
});
test('real Git diff includes the whole branch and fails on an unknown base', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tt-release-scope-'));
  const git = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  try {
    git('init', '-q'); git('config', 'user.name', 'Test'); git('config', 'user.email', 'test@example.invalid');
    writeFileSync(join(dir, queue.path), '# Queue\n');
    git('add', '.'); git('commit', '-qm', 'base'); const base = git('rev-parse', 'HEAD');
    writeFileSync(join(dir, queue.path), '# Queue\nDone\n');
    git('add', '.'); git('commit', '-qm', 'accounting');
    assert.equal(classifyRelease(gitChanges(base, 'HEAD', dir).changes), 'accounting');
    mkdirSync(join(dir, 'src')); writeFileSync(join(dir, 'src', 'code.js'), 'changed\n');
    git('add', '.'); git('commit', '-qm', 'code');
    const codeHead = git('rev-parse', 'HEAD');
    writeFileSync(join(dir, queue.path), '# Queue\nDone again\n');
    git('add', '.'); git('commit', '-qm', 'second accounting push');
    assert.equal(classifyRelease(gitChanges(codeHead, 'HEAD', dir).changes), 'accounting');
    assert.equal(classifyRelease(gitChanges(base, 'HEAD', dir).changes), 'full');
    assert.throws(() => gitChanges('missing-base', 'HEAD', dir));
    git('mv', queue.path, 'OTHER.md'); git('commit', '-qam', 'rename');
    assert.equal(classifyRelease(gitChanges(base, 'HEAD', dir).changes), 'full');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
