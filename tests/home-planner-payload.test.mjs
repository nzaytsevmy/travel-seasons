import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { externalizeHomePayload } from '../scripts/home-planner-payload.mjs';

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
