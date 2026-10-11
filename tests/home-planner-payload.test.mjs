import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { externalizeHomePayload, preloadHomeModules } from '../scripts/home-planner-payload.mjs';

test('homepage preloads only its real static shared imports, once', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'home-modules-'));
  try {
    fs.mkdirSync(path.join(dir, '_astro'));
    fs.writeFileSync(path.join(dir, '_astro/home.js'), 'import{a}from"./destination-selection.abc.js";import{b}from"./affiliate.def.js";const text=\'import{x}from"./affiliate.fake.js";\';');
    for (const name of ['destination-selection.abc.js', 'affiliate.def.js']) fs.writeFileSync(path.join(dir, '_astro', name), 'export const a=1;');
    const html = '<html><head><script src="/_astro/home.js" type="module"></script></head><body><a href="/georgia/">Guide</a></body></html>';
    const result = preloadHomeModules(html, dir);
    assert.deepEqual(result.modulePreloads, ['/_astro/destination-selection.abc.js', '/_astro/affiliate.def.js']);
    assert.equal((result.html.match(/rel="modulepreload"/g) || []).length, 2);
    assert.ok(result.html.includes('<a href="/georgia/">Guide</a>'));
    assert.equal(preloadHomeModules(result.html, dir).html, result.html);
    fs.unlinkSync(path.join(dir, '_astro/affiliate.def.js'));
    assert.throws(() => preloadHomeModules(html, dir), /ENOENT/);
    assert.throws(() => preloadHomeModules('<script type="module" src="/_astro/../../outside.js"></script>', dir), /Invalid/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('external payload preserves exact planning data and server-rendered guide links', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'home-payload-'));
  try {
    const data = { month: 10, rows: [{ slug: 'georgia', budget: null }], pools: { georgia: [{ id: 'original', alt: 'Грузия' }] }, reserved: ['hero'] };
    fs.writeFileSync(path.join(dir, 'index.html'), `<main><a href="/georgia/">Грузия</a></main><script type="application/json" id="homeData">${JSON.stringify(data)}</script>`);
    const result = externalizeHomePayload(dir);
    const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
    assert.ok(html.includes('<a href="/georgia/">Грузия</a>'));
    assert.ok(!html.includes('"rows"'));
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir, result.dataUrl.slice(1)))), data);
    assert.equal(externalizeHomePayload(dir).unchanged, true);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test('missing or invalid planner data fails the build instead of silently removing it', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'home-payload-'));
  try { fs.writeFileSync(path.join(dir, 'index.html'), '<main>Guide</main>'); assert.throws(() => externalizeHomePayload(dir), /missing/); }
  finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
