import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'tt-lock-'));
process.env.TT_LOCK_DIR = dir;
delete process.env.CI;
const { acquire } = await import('../scripts/machine-lock.mjs');

test('замок берётся и отпускается', async () => {
  const release = await acquire('a', { log: () => {} });
  assert.ok(existsSync(join(dir, 'a.lock')));
  release();
  assert.ok(!existsSync(join(dir, 'a.lock')));
});

test('второй процесс ждёт, пока первый держит замок', async () => {
  const holder = spawn(process.execPath, ['-e', `
    process.env.TT_LOCK_DIR = ${JSON.stringify(dir)}; delete process.env.CI;
    const { acquire } = await import(${JSON.stringify(new URL('../scripts/machine-lock.mjs', import.meta.url).href)});
    const r = await acquire('b', { log: () => {} }); console.log('held');
    setTimeout(() => { r(); process.exit(0); }, 2500);
  `], { stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((resolve) => holder.stdout.once('data', resolve));
  const t0 = Date.now();
  const release = await acquire('b', { log: () => {} });
  assert.ok(Date.now() - t0 >= 2_000, `ждал ${Date.now() - t0} мс — должен был ждать держателя`);
  release();
});

test('брошенный замок мёртвого процесса забирается', async () => {
  const lock = join(dir, 'c.lock');
  mkdirSync(lock);
  writeFileSync(join(lock, 'owner'), JSON.stringify({ pid: 999999, cwd: '/nowhere', at: 'x' }));
  const t0 = Date.now();
  const release = await acquire('c', { log: () => {} });
  assert.ok(Date.now() - t0 < 5_000);
  release();
});

test('в CI замок выключен', async () => {
  process.env.CI = '1';
  const release = await acquire('d', { log: () => {} });
  assert.ok(!existsSync(join(dir, 'd.lock')));
  release();
  delete process.env.CI;
});
