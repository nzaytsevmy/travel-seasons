// Manual release evidence: existing structural checks at all four widths,
// optional preview captures, and exact production identity before and after.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';
import { checkPageStructure, WIDTHS } from './structural-checks.mjs';
import { isReleaseQaPath } from './release-qa-paths.mjs';

const allPaths = JSON.parse(process.env.QA_PATHS || '[]');
assert.ok(Array.isArray(allPaths) && allPaths.length > 0 && allPaths.length <= 100);
assert.equal(new Set(allPaths).size, allPaths.length, 'Duplicate paths');
for (const path of allPaths) assert.ok(isReleaseQaPath(path), `Invalid release QA path: ${path}`);
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
          const galleries = page.locator('.post-gallery');
          const articleSlug = path.match(/^\/blog\/([a-z0-9-]+)\/$/)?.[1];
          const articleSource = articleSlug && `src/content/blog/${articleSlug}.mdx`;
          if (articleSource && fs.existsSync(articleSource)) {
            const expected = (fs.readFileSync(articleSource, 'utf8').match(/<PhotoGallery\b/g) || []).length;
            assert.equal(await galleries.count(), expected, 'Published gallery count differs from source');
          }
          row.galleries = [];
          for (const container of await galleries.all()) {
            const gallery = container.locator('[role="region"]');
            await gallery.scrollIntoViewIfNeeded();
            const images = gallery.locator('img');
            const count = await images.count();
            assert.ok(count >= 3, 'Every author gallery needs at least three photographs');
            await images.evaluateAll(nodes => nodes.forEach(node => node.loading = 'eager'));
            await page.waitForFunction(id => [...document.getElementById(id).querySelectorAll('img')]
              .every(image => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0), await gallery.getAttribute('id'), { timeout: 30000 });
            const frames = await images.evaluateAll(nodes => nodes.map(image => ({ src: image.currentSrc, alt: image.alt, width: image.naturalWidth, height: image.naturalHeight })));
            assert.equal(new Set(frames.map(frame => frame.src)).size, count, 'Repeated gallery photographs');
            assert.ok(frames.every(frame => frame.alt.length >= 15), 'Missing descriptive gallery alt');
            const previous = container.locator('[data-photo-prev]');
            const next = container.locator('[data-photo-next]');
            assert.ok(await previous.isDisabled(), 'Previous must start disabled');
            const id = await gallery.getAttribute('id');
            const prefix = `${directory}/${path.replaceAll('/', '-').replace(/^-|-$/g, '')}-${width}-${id}`;
            if (capture && [402, 1280].includes(width)) await container.screenshot({ path: `${prefix}-first.png` });
            for (let index = 1; index < count; index++) {
              await next.click();
              await page.waitForFunction(({ id, index }) => {
                const gallery = document.getElementById(id);
                const figures = [...gallery.querySelectorAll('figure')];
                return Math.abs(figures[index].offsetLeft - figures[0].offsetLeft - gallery.scrollLeft) < 2;
              }, { id, index });
            }
            assert.ok(await next.isDisabled(), 'Next must stop at the last photograph');
            if (capture && [402, 1280].includes(width)) await container.screenshot({ path: `${prefix}-last.png` });
            await previous.focus();
            await page.keyboard.press('Enter');
            assert.ok(await next.isEnabled(), 'Keyboard must return from the last photograph');
            row.galleries.push({ id, photographs: count, frames, buttons: 'PASS', keyboard: 'PASS' });
          }
          await page.evaluate(() => window.scrollTo(0, 0));
          if (capture && [402, 1280].includes(width)) {
            const prefix = `${directory}/${path.replaceAll('/', '-').replace(/^-|-$/g, '') || 'home'}-${width}`;
            await page.evaluate(() => document.fonts.ready);
            await page.screenshot({ path: `${prefix}-top.png` });
            const hotels = page.locator('.best-hotels, .hotel-entry').first();
            if (await hotels.count()) {
              await hotels.scrollIntoViewIfNeeded();
              await hotels.locator('img').evaluateAll(images => Promise.all(images.map(async image => {
                image.loading = 'eager';
                await Promise.race([image.decode(), new Promise((_, reject) => setTimeout(() => reject(new Error('Hotel capture image did not decode')), 30000))]);
              })));
              await hotels.screenshot({ path: `${prefix}-hotels.png` });
            }
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
