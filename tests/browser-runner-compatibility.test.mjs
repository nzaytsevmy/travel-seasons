import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { load } from 'js-yaml';

// Playwright 1.59 has no Ubuntu 26.04 browser builds. A moving runner label
// can fail before any browser test, even when the browser cache is warm.
for (const file of ['content-gate.yml', 'visual-tests.yml', 'release-live-qa.yml']) {
  const workflow = load(readFileSync(new URL(`../.github/workflows/${file}`, import.meta.url), 'utf8'));
  for (const [name, job] of Object.entries(workflow.jobs)) {
    if (!(job.steps ?? []).some(step => /\bplaywright install\b/.test(step.run ?? ''))) continue;
    test(`${file}/${name}: browser installation uses an explicit supported Linux image`, () => {
      assert.ok(['ubuntu-22.04', 'ubuntu-24.04'].includes(job['runs-on']),
        `Unsupported or moving browser runner: ${job['runs-on']}`);
    });
  }
}
