import test from 'node:test';
import assert from 'node:assert/strict';
import { workflowOnly, protectedCi } from '../scripts/workflow-push-scope.mjs';
import { requiredChecks } from '../scripts/auto-merge-policy.mjs';
import { GATE_NAME } from '../scripts/bot-update-policy.mjs';

const entry = (path, patch = {}) => ({ path, mode: '100644', status: 'M', ...patch });
const rules = (names) => [{ type: 'pull_request' }, { type: 'required_status_checks', parameters: {
  required_status_checks: names.map((context) => ({ context, integration_id: 15368 })),
} }];

test('workflow-only gate is narrow: no source, data, images, dependency or unrelated script changes', () => {
  assert.equal(workflowOnly([entry('.github/workflows/source-watch.yml'), entry('scripts/checked-pr-controller.mjs')]), true);
  for (const path of ['src/data/prices-cache.json', 'src/pages/index.astro', 'package.json',
    'scripts/fetch-prices.mjs', '.github/workflows/deploy.yml', 'src/content/blog/post.md']) {
    assert.equal(workflowOnly([entry('scripts/bot-publish.mjs'), entry(path)]), false);
  }
  assert.equal(workflowOnly([entry('CLAUDE.md')]), false);
  assert.equal(workflowOnly([]), false);
});

test('deletions, renames and symlinks cannot use the workflow-only path', () => {
  for (const patch of [{ status: 'D' }, { status: 'R100' }, { mode: '120000' }, { mode: '100755' }]) {
    assert.equal(workflowOnly([entry('scripts/bot-publish.mjs', patch)]), false);
  }
  assert.equal(workflowOnly([entry('scripts/pre-push.sh', { mode: '100755' })]), true);
});

test('local workflow gate requires actual native PR and complete server check protection', () => {
  assert.equal(protectedCi(rules(requiredChecks(['src/pages/index.astro']))), true);
  const core = requiredChecks(['note.md']);
  assert.equal(protectedCi(rules([...core, GATE_NAME])), true);
  assert.equal(protectedCi(rules(core)), false);
  assert.equal(protectedCi(rules([GATE_NAME])), false);
  assert.equal(protectedCi(rules([...core, GATE_NAME]).slice(1)), false);
  const spoofed = rules([...core, GATE_NAME]);
  spoofed[1].parameters.required_status_checks.at(-1).integration_id = 999;
  assert.equal(protectedCi(spoofed), false);
});
