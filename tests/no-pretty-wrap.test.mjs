import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scanStyles } from '../scripts/check-no-pretty.mjs';

test('в полных исходниках сайта нет text-wrap: pretty', () => {
  const result = scanStyles(join(import.meta.dirname, '..', 'src'));
  assert.deepEqual(result.bad, []);
  console.log(`Проверено файлов стилей и шаблонов: ${result.scanned}`);
});

test('тот же сканер отклоняет пустые и частичные исходники и видит реальное нарушение', () => {
  const root = mkdtempSync(join(tmpdir(), 'pretty-'));
  try {
    assert.throws(() => scanStyles(root), /Неполный охват/);
    writeFileSync(join(root, 'page.astro'), '<p>Текст</p>');
    assert.throws(() => scanStyles(root), /Неполный охват/);
    writeFileSync(join(root, 'style.css'), 'td { text-wrap: pretty }');
    assert.deepEqual(scanStyles(root).bad, ['style.css']);
    writeFileSync(join(root, 'style.css'), '/* text-wrap: pretty нельзя */ td { text-wrap: balance }');
    assert.deepEqual(scanStyles(root), {scanned: 2, bad: []});
  } finally { rmSync(root, {recursive: true, force: true}); }
});
