import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

test('destination font files match the verified Fontsource inputs and generated outputs', () => {
  const root = new URL('../', import.meta.url);
  const directory = new URL('src/assets/fonts/destinations/', root);
  const manifest = JSON.parse(readFileSync(new URL('manifest.json', directory), 'utf8'));
  const digest = path => createHash('sha256').update(readFileSync(path)).digest('hex');
  for (const [source, expected] of Object.entries(manifest.sources)) {
    assert.equal(digest(new URL(source, root)), expected, `Fontsource changed: regenerate and verify ${source}`);
  }
  for (const [name, expected] of Object.entries(manifest.outputs)) {
    const url = new URL(name, directory);
    assert.equal(digest(url), expected.sha256, `Unverified font bytes: ${name}`);
    assert.equal(readFileSync(url).length, expected.bytes);
  }
});
