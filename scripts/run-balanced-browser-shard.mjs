import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Native balanced source a77f32ca completed every selected hotel case, but
// forty minutes cut off the remaining site checks. Measured p90 hotel work
// plus unchanged site cases projects about47minutes; retain a finite reserve.
export const BROWSER_SUITE_BUDGET_MS = 60 * 60 * 1000;
export const browserProjects = ['chromium-desktop', 'webkit-desktop', 'chromium-tablet', 'webkit-mobile'];
const hotelFiles = new Set(['hotel-guides.spec.ts', 'hotel-retina.spec.ts', 'hotel-referral-browser.spec.ts']);
export const isHotelCase = key => hotelFiles.has(JSON.parse(key)[1]);
export function testListEntry(key) {
  const [project, file, fileSuite, ...titles] = JSON.parse(key);
  assert.equal(titles.pop(), 0, 'Test-list selection requires repeatEach=1');
  assert.equal(fileSuite, file, 'Unexpected native file suite');
  assert([project, file, ...titles].every(value => !/[\r\n›]/.test(value)), 'Ambiguous test-list entry');
  return `[${project}] › ${file} › ${titles.join(' › ')}`;
}
export function selectedPartKeys(globalKeys, stockKeys, part) {
  const quarter = Number(part.shard.split('/')[0]);
  const hotels = globalKeys.filter(key => JSON.parse(key)[0] === part.project && isHotelCase(key));
  return [...stockKeys.filter(key => !isHotelCase(key)), ...hotels.filter((_, i) => i % 4 === quarter - 1)].sort();
}
export function browserParts(index) {
  assert(Number.isInteger(index) && index >= 1 && index <= 4);
  // Rotate the quarters: assigning the same quarter in every project would
  // concentrate all the expensive hotel tests in a single job again.
  return browserProjects.map((project, i) => ({ project, shard: `${(index - 1 + i) % 4 + 1}/4` }));
}
export function caseKeys(report) {
  const keys = [];
  function visit(suites, parents = []) {
    for (const suite of suites || []) {
      const titles = [...parents, suite.title];
      for (const spec of suite.specs || []) for (const test of spec.tests || []) {
        const file = path.isAbsolute(spec.file) ? path.relative(report.config.rootDir, spec.file) : spec.file;
        keys.push(JSON.stringify([test.projectName, file, ...titles, spec.title, test.repeatEachIndex || 0]));
      }
      visit(suite.suites, titles);
    }
  }
  visit(report.suites);
  assert.equal(keys.length, new Set(keys).size, 'Duplicate test identities');
  return keys.sort();
}
export function run(index, { command = spawnSync, now = Date.now, outputRoot = process.cwd() } = {}) {
  const startedAt = now(), deadline = startedAt + BROWSER_SUITE_BUDGET_MS;
  const reportRoot = path.resolve(outputRoot, 'tests/.html-report');
  const cli = 'node_modules/@playwright/test/cli.js';
  fs.mkdirSync(reportRoot, { recursive: true });
  function inventory(args = [], filename = 'full-inventory.json') {
    const result = command(process.execPath, [cli, 'test', ...args, '--list', '--reporter=json'],
      { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, env: process.env });
    assert.equal(result.status, 0, result.stderr || 'Playwright inventory failed');
    fs.writeFileSync(path.join(reportRoot, filename), result.stdout);
    return JSON.parse(result.stdout);
  }
  const full = inventory();
  assert.deepEqual(full.config.projects.map(p => p.name).sort(), [...browserProjects].sort());
  const globalCaseKeys = caseKeys(full), parts = [];
  let passed = true;
  function save() {
    const proof = { shard: index, source: process.env.GITHUB_SHA || null, globalCaseKeys,
      globalCaseKeysSha256: createHash('sha256').update(JSON.stringify(globalCaseKeys)).digest('hex'),
      plannedParts: browserParts(index), budgetMs: BROWSER_SUITE_BUDGET_MS,
      startedAt: new Date(startedAt).toISOString(), elapsedMs: now() - startedAt, parts,
      passed: parts.length === browserProjects.length && parts.every(part => part.passed) };
    fs.writeFileSync(path.join(reportRoot, 'balanced-shard.json'), JSON.stringify(proof, null, 2));
    return proof;
  }
  save();
  for (const part of browserParts(index)) {
    const stockArgs = [`--project=${part.project}`, `--shard=${part.shard}`];
    const stockKeys = caseKeys(inventory(stockArgs, `${part.project}-stock-inventory.json`));
    const expected = selectedPartKeys(globalCaseKeys, stockKeys, part);
    assert(expected.length > 0 && expected.every(key => globalCaseKeys.includes(key)));
    const listFile = path.join(reportRoot, `${part.project}-test-list.txt`);
    fs.writeFileSync(listFile, expected.map(testListEntry).join('\n') + '\n');
    const args = [`--project=${part.project}`, `--test-list=${listFile}`];
    assert.deepEqual(caseKeys(inventory(args, `${part.project}-inventory.json`)), expected,
      'Native test-list selection must exactly preserve the planned identities');
    const directory = path.resolve(reportRoot, part.project);
    fs.mkdirSync(directory, { recursive: true });
    const jsonFile = path.resolve(outputRoot, 'test-results', part.project, 'tests.json');
    const remainingMs = Math.max(0, deadline - now());
    console.log(JSON.stringify({ fullBrowserMatrixPart: part, expectedCases: expected.length, remainingMs }));
    const result = remainingMs > 0 ? command(process.execPath, [cli, 'test', ...args,
      `--global-timeout=${remainingMs}`, `--output=${path.resolve(outputRoot, 'test-results', part.project)}`, '--reporter=list,html,json'],
    { stdio: 'inherit', env: { ...process.env, PLAYWRIGHT_HTML_OUTPUT_DIR: directory,
      PLAYWRIGHT_JSON_OUTPUT_FILE: jsonFile, PLAYWRIGHT_HTML_OPEN: 'never' } }) : { status: null, signal: null };
    const receipt = { ...part, selectionMethod: 'native-nonhotel-quarter-and-interleaved-hotels',
      stockCaseKeys: stockKeys, expectedCaseKeys: expected, testListFile: `${part.project}-test-list.txt`,
      reportFile: `test-results/${part.project}/tests.json`,
      exitCode: result.status, signal: result.signal || null, remainingMs, passed: false };
    try {
      assert(remainingMs > 0, 'Browser suite budget exhausted before this part; coverage incomplete');
      const actual = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
      assert.deepEqual(caseKeys(actual), expected, 'Executed cases differ from the native inventory');
      assert.equal(actual.stats.unexpected, 0); assert.equal(actual.stats.flaky, 0);
      assert.equal(result.status, 0, 'The complete project part must pass');
      receipt.passed = true;
    } catch (error) { receipt.error = error.message; passed = false; }
    parts.push(receipt);
    save();
    // Attempt every remaining part; exhausted budget or partial coverage always fails.
  }
  const proof = save();
  fs.writeFileSync(path.join(reportRoot, 'index.html'), `<!doctype html><meta charset="utf-8">
    <title>Complete browser matrix: shard ${index}/4</title>
    <h1>Complete browser matrix: shard ${index}/4</h1><p>${passed ? 'Passed' : 'Failed'}</p>
    <ul>${parts.map(p => `<li><a href="${p.project}/index.html">${p.project}, part ${p.shard}</a></li>`).join('')}</ul>
    <a href="balanced-shard.json">Exact coverage and exit codes</a>`);
  return proof;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = run(Number(process.argv[2])).passed ? 0 : 1;
