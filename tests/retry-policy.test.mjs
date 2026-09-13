import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, readFileSync, symlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

test('настоящая политика проекта отклоняет flaky и пропускает стабильный тест', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tt-retry-probe-'));
  try {
    symlinkSync(resolve('node_modules'), join(dir, 'node_modules'), 'dir');
    writeFileSync(join(dir, 'package.json'), '{"type":"module"}');
    writeFileSync(join(dir, 'config.ts'), `import base from ${JSON.stringify(resolve('playwright.config.ts'))};
export default {...base, testDir: '.', testMatch: 'probe.spec.ts', globalSetup: undefined,
webServer: undefined, projects: [{name: 'probe'}], reporter: 'line', workers: 1, respectGitIgnore: false, outputDir: './results'};`);
    writeFileSync(join(dir, 'probe.spec.ts'), `import {test,expect} from '@playwright/test';
test('control', ({}, info) => expect(process.env.PROBE_FLAKY ? info.retry : 1).toBe(1));`);
    for (const flaky of [true, false]) {
      const run = spawnSync(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', '-c', join(dir, 'config.ts')],
        {encoding: 'utf8', timeout: 30000, env: {...process.env, PROBE_FLAKY: flaky ? '1' : ''}});
      assert.equal(run.error, undefined);
      assert.equal(run.status, flaky ? 1 : 0, run.stdout + run.stderr);
      if (flaky) assert.match(run.stdout, /1 flaky/, run.stderr);
    }
    for (const file of ['scripts/pre-push.sh', '.github/workflows/visual-tests.yml']) {
      assert.doesNotMatch(readFileSync(file, 'utf8'), /--last-failed/, `${file}: внешний повтор обнуляет историю попыток`);
    }
  } finally { rmSync(dir, {recursive: true, force: true}); }
});
