// Manual release evidence: existing structural checks at all four widths,
// optional preview captures, and exact production identity before and after.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';
import { checkPageStructure, WIDTHS } from './structural-checks.mjs';

const allPaths = JSON.parse(process.env.QA_PATHS || '[]');
assert.ok(Array.isArray(allPaths) && allPaths.length > 0 && allPaths.length <= 100);
assert.equal(new Set(allPaths).size, allPaths.length, 'Duplicate paths');
for (const path of allPaths) assert.match(path, /^\/(?:[a-z0-9-]+\/)*$/);
const shard = Number(process.env.QA_SHARD || 1);
const shards = Number(process.env.QA_SHARDS || 1);
assert.ok(Number.isInteger(shard) && Number.isInteger(shards) && shard >= 1 && shard <= shards && shards <= 4);
const paths = allPaths.filter((_, index) => index % shards === shard - 1);
const preview = process.env.QA_PREVIEW === '1';
const capture = process.env.QA_CAPTURE === '1';
const origin = preview ? 'http://localhost:4322' : 'https://traveltribe.ru';
const expectedCommit = process.env.QA_EXPECTED_COMMIT;
if (!preview) assert.match(expectedCommit || '', /^[a-f0-9]{40}$/);
const directory = 'artifacts/release-browser-qa';
fs.mkdirSync(directory, { recursive: true });
const proof = { startedAt: new Date().toISOString(), source: process.env.GITHUB_SHA,
  preview, origin, paths, shard, shards, totalPaths: allPaths.length,
  widths: WIDTHS, expected: paths.length * WIDTHS.length,
  rows: [], passed: false };
const save = () => fs.writeFileSync(`${directory}/proof.json`, JSON.stringify(proof, null, 2));
async function identity() {
  const response = await fetch(`${origin}/build-version.json?release_qa=${Date.now()}`,
    { signal: AbortSignal.timeout(30000), headers: { 'Cache-Control': 'no-cache' } });
  assert.equal(response.status, 200);
  const value = await response.json();
  assert.equal(value.commit, expectedCommit, 'Production must serve the requested commit');
  return value;
}
let browser;
try {
  if (!preview) proof.identityBefore = await identity();
  browser = await chromium.launch();
  for (const path of paths) {
    const context = await browser.newContext({ serviceWorkers: 'block' });
    try {
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      page.setDefaultNavigationTimeout(60000);
      for (const width of WIDTHS) {
        const row = { path, width, findings: [] };
        try {
          row.findings = await checkPageStructure(page, `${origin}${path}?release_qa=${Date.now()}`, width);
          if (capture && [402, 1280].includes(width)) {
            const prefix = `${directory}/${path.replaceAll('/', '-').replace(/^-|-$/g, '') || 'home'}-${width}`;
            await page.evaluate(() => document.fonts.ready);
            await page.screenshot({ path: `${prefix}-top.png` });
            const revised = page.locator('h2').filter({ hasText: /добраться|стоит|цены|стоимость|бюджет/iu }).first();
            if (await revised.count()) {
              await revised.scrollIntoViewIfNeeded();
              await page.screenshot({ path: `${prefix}-section.png` });
            }
            const photo = page.locator('.prose img').first();
            if (await photo.count()) {
              await photo.scrollIntoViewIfNeeded();
              await photo.evaluate(img => Promise.race([img.decode().catch(() => {}),
                new Promise(resolve => setTimeout(resolve, 8000))]));
              await page.screenshot({ path: `${prefix}-photo.png` });
            }
            await page.locator('footer').last().scrollIntoViewIfNeeded();
            await page.screenshot({ path: `${prefix}-footer.png` });
          }
        } catch (error) { row.findings.push(String(error)); }
        row.passed = row.findings.length === 0;
        proof.rows.push(row);
        save();
        console.log(JSON.stringify(row));
      }
    } finally { await context.close(); }
  }
  if (!preview) {
    proof.identityAfter = await identity();
    assert.deepEqual(proof.identityAfter, proof.identityBefore, 'Production changed during verification');
  }
  proof.passed = proof.rows.length === proof.expected && proof.rows.every(row => row.passed);
} catch (error) { proof.error = String(error); }
finally {
  if (browser) await browser.close();
  proof.finishedAt = new Date().toISOString();
  save();
}
console.log(JSON.stringify({ passed: proof.passed, checked: proof.rows.length, expected: proof.expected, error: proof.error }));
if (!proof.passed) process.exitCode = 1;
