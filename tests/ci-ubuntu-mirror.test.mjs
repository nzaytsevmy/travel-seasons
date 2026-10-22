import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import YAML from 'yaml';

test('WebKit setup resolves the runner mirror list without changing Ubuntu trust or suites', () => {
  const workflow = YAML.parse(readFileSync(new URL('../.github/workflows/visual-tests.yml', import.meta.url), 'utf8'));
  const step = workflow.jobs.visual.steps.find(item => item.name === 'Системные библиотеки для WebKit');
  const expression = step.run.match(/sudo sed -i '([^']+)'/u)?.[1];
  assert.ok(expression, 'Test the actual workflow replacement');
  const sources = uri => `Types: deb\nURIs: ${uri}\nSuites: noble noble-updates noble-backports\nComponents: main restricted universe multiverse\nSigned-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg\n\nTypes: deb\nURIs: https://security.ubuntu.com/ubuntu/\nSuites: noble-security\nComponents: main restricted universe multiverse\nSigned-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg\n`;
  for (const uri of [
    'mirror+file:/etc/apt/apt-mirrors.txt',
    'http://azure.archive.ubuntu.com/ubuntu/',
    'https://azure.archive.ubuntu.com/ubuntu/',
  ]) {
    const output = execFileSync('sed', [expression], { input: sources(uri), encoding: 'utf8', timeout: 5000 });
    assert.equal(output, sources('https://archive.ubuntu.com/ubuntu/'), `Canonical source for ${uri}; preserve all other fields`);
  }
  const unrelated = sources('https://azureXarchiveXubuntuXcom/ubuntu/');
  assert.equal(execFileSync('sed', [expression], { input: unrelated, encoding: 'utf8', timeout: 5000 }), unrelated);
  assert.equal(step['timeout-minutes'], 10);
  assert.match(step.run, /npx playwright install-deps webkit/u);
});
