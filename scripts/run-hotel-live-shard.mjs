import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { caseKeys, browserProjects } from './run-balanced-browser-shard.mjs';

export function hotelShardTitles(titles, index) {
  assert(Number.isInteger(index) && index >= 1 && index <= 4, 'Invalid hotel shard');
  assert(titles.length >= 4 && titles.length === new Set(titles).size, 'Missing or duplicate hotel identities');
  // Native contiguous shards placed all 70 Retina cases in quarter 4.
  // Interleave the same source-listed cases so every quarter gets Retina work.
  return titles.filter((_, offset) => offset % 4 === index - 1);
}
export function hotelTitlePattern(titles) {
  assert(titles.length > 0);
  return `(?:${titles.map(title => title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})$`;
}
function titlesIn(report) {
  const titles = [];
  function visit(suites = []) {
    for (const suite of suites) {
      for (const spec of suite.specs || []) {
        assert.equal(spec.tests.length, 1, 'Inventory must contain exactly one browser project');
        titles.push(spec.title);
      }
      visit(suite.suites);
    }
  }
  visit(report.suites);
  return titles;
}
function run(index) {
  const project = process.env.HOTEL_PROJECT;
  assert(browserProjects.includes(project), 'Unknown hotel browser project');
  const cli = 'node_modules/@playwright/test/cli.js';
  const args = ['tests/hotel-guides.spec.ts', 'tests/hotel-retina.spec.ts', 'tests/hotel-referral-browser.spec.ts', `--project=${project}`];
  const directory = `artifacts/hotel-guides-live-${project}-${index}`;
  fs.mkdirSync(directory, { recursive: true });
  function inventory(extra) {
    const env = { ...process.env };
    delete env.PLAYWRIGHT_JSON_OUTPUT_NAME;
    delete env.PLAYWRIGHT_JSON_OUTPUT_FILE;
    const result = spawnSync(process.execPath, [cli, 'test', ...args, ...extra, '--list', '--reporter=json'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, env });
    assert.equal(result.status, 0, result.stderr || 'Hotel inventory failed');
    return JSON.parse(result.stdout);
  }
  const full = inventory([]), titles = titlesIn(full);
  const selected = hotelShardTitles(titles, index), grep = hotelTitlePattern(selected);
  const filtered = inventory([`--grep=${grep}`]);
  assert.deepEqual(titlesIn(filtered), selected, 'Filtered inventory differs from the source-listed quarter');
  const expected = caseKeys(filtered), all = caseKeys(full);
  assert(expected.length === selected.length && expected.every(key => all.includes(key)));
  fs.writeFileSync(path.join(directory, 'shard-inventory.json'), JSON.stringify({ project, shard: index, sourceHead: process.env.GITHUB_SHA, fullCaseKeys: all, expectedCaseKeys: expected, fullTitles: titles, selectedTitles: selected }, null, 2));
  const result = spawnSync(process.execPath, [cli, 'test', ...args, `--grep=${grep}`, '--reporter=line,json'], { stdio: 'inherit', env: process.env });
  assert.equal(result.status, 0, 'The complete hotel quarter must pass');
  const report = JSON.parse(fs.readFileSync(process.env.PLAYWRIGHT_JSON_OUTPUT_FILE || process.env.PLAYWRIGHT_JSON_OUTPUT_NAME, 'utf8'));
  assert.deepEqual(caseKeys(report), expected, 'Executed hotel cases differ from the source-listed quarter');
  assert.equal(report.stats.unexpected, 0);
  assert.equal(report.stats.flaky, 0);
  assert.equal(report.stats.skipped, 0);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) run(Number(process.argv[2]));
