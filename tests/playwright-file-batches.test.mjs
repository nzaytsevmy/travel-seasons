import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileBatches } from '../scripts/playwright-file-batches.mjs';

const collection = () => ({
  config: { rootDir: '/tmp/example [site]/tests' }, errors: [],
  suites: [{ specs: [{ file: 'first.spec.ts', id: 'a', tests: [{ projectId: 'chromium' }, { projectId: 'webkit' }] }],
    suites: [{ specs: [{ file: 'nested/second.spec.ts', id: 'b', tests: [{ projectId: 'webkit' }] }] }] }],
});

test('batches include nested files and every project; filters match exact paths', () => {
  const result = fileBatches(collection());
  assert.equal(result.tests, 3);
  assert.equal(result.matches.length, 2);
  const patterns = result.matches.map(s => new RegExp(s));
  for (const name of ['first.spec.ts', 'nested/second.spec.ts']) {
    const exact = `/tmp/example [site]/tests/${name}`;
    assert.equal(patterns.filter(p => p.test(exact)).length, 1);
    assert.ok(patterns.every(p => !p.test(exact + '.backup')));
    assert.ok(patterns.every(p => !p.test('prefix' + exact)));
    assert.ok(patterns.every(p => !p.test(exact.replace('[site]', 'site'))));
  }
});

test('incomplete, empty, duplicate and out-of-root collections fail closed', () => {
  const cases = [
    { ...collection(), errors: [{ message: 'collection failure' }] },
    { ...collection(), suites: [] },
    { suites: [] },
  ];
  for (const change of [
    spec => { spec.file = '../outside.spec.ts'; },
    spec => { spec.file = 'bad\nfile.spec.ts'; },
    spec => { spec.tests = []; },
    spec => { spec.tests[0].projectId = ''; },
    spec => { spec.tests.push({ projectId: 'webkit' }); },
  ]) {
    const c = collection(); change(c.suites[0].specs[0]); cases.push(c);
  }
  for (const c of cases) assert.throws(() => fileBatches(c));
});

test('CLI works from a path with spaces and returns nonzero without filters on collection error', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tt batch check '));
  try {
    const script = path.join(dir, 'collector.mjs'), input = path.join(dir, 'list.json');
    fs.copyFileSync(new URL('../scripts/playwright-file-batches.mjs', import.meta.url), script);
    fs.writeFileSync(input, JSON.stringify(collection()));
    const good = spawnSync(process.execPath, [script, input], { encoding: 'utf8' });
    assert.equal(good.status, 0, good.stderr);
    assert.deepEqual(good.stdout.trim().split('\n'), fileBatches(collection()).matches);
    fs.writeFileSync(input, JSON.stringify({ ...collection(), errors: [{ message: 'failed' }] }));
    const bad = spawnSync(process.execPath, [script, input], { encoding: 'utf8' });
    assert.notEqual(bad.status, 0);
    assert.equal(bad.stdout, '');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
