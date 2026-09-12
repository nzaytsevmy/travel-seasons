import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// ⛔ text-wrap: pretty не ставим ни в абзацах, ни в пунктах, ни в ячейках: 10.09.2026 он ронял
// WebKit (движок Safari) в разборе текста внутри сетки — четыре отчёта о падении за час, а в
// тестах это выглядело как таймаут страницы. Правило было записано текстом, проверки не было,
// и 12.09.2026 аудит нашёл свойство в ячейках таблиц общего файла стилей.

const ROOT = join(import.meta.dirname, '..', 'src');

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return files(p);
    return /\.(css|astro|scss)$/.test(name) ? [p] : [];
  });
}

test('в стилях сайта нет text-wrap: pretty', () => {
  const bad = [];
  for (const f of files(ROOT)) {
    // Вычитаем только комментарии стилей. Вырезание HTML-комментариев регуляркой анализатор
    // кода GitHub считает неполной очисткой разметки (12.09.2026 — предупреждение высокой
    // важности на этой строке), а pretty в HTML-комментарии шаблона не встречается.
    const text = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    if (/text-wrap\s*:\s*pretty/i.test(text)) bad.push(f.slice(ROOT.length + 1));
  }
  assert.deepEqual(bad, []);
});

test('сторож видит подложенное свойство и не видит его в комментарии', () => {
  const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(/text-wrap\s*:\s*pretty/i.test(strip('td { text-wrap:pretty }')));
  assert.ok(!/text-wrap\s*:\s*pretty/i.test(strip('/* text-wrap: pretty не ставить */ td { text-wrap: balance }')));
});
